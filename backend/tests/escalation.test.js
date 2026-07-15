import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Issue from "../src/models/Issue.js";
import User from "../src/models/User.js";
import { runEscalationCheck } from "../src/services/escalationService.js";

vi.mock("../src/utils/uploadToCloudinary.js", () => ({
  uploadToCloudinary: vi
    .fn()
    .mockResolvedValue({
      secure_url: "https://res.cloudinary.com/fake/test.jpg",
    }),
}));
vi.mock("../src/services/aiService.js", () => ({
  categorizeIssue: vi.fn().mockResolvedValue(null),
  generateTitle: vi.fn().mockResolvedValue(null),
  findDuplicates: vi.fn().mockResolvedValue([]),
}));
vi.mock("../src/utils/emailService.js", () => ({
  sendStatusChangeEmail: vi.fn().mockResolvedValue(),
  sendAssignmentEmail: vi.fn().mockResolvedValue(),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(),
  sendVerificationEmail: vi.fn().mockResolvedValue(),
  sendEscalationEmail: vi.fn().mockResolvedValue(),
}));
vi.mock("../src/utils/smsService.js", () => ({
  sendStatusChangeSMS: vi.fn().mockResolvedValue(),
  sendAssignmentSMS: vi.fn().mockResolvedValue(),
  checkSmsBalance: vi.fn().mockResolvedValue(null),
}));
import { sendEscalationEmail } from "../src/utils/emailService.js";

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const backdateDeadline = async (issueId, hoursAgo) =>
  Issue.findByIdAndUpdate(issueId, {
    slaDeadline: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  });

describe("SLA escalation sweep", () => {
  beforeEach(() => vi.clearAllMocks());

  it("escalates an overdue open issue and notifies the correct scoped admin", async () => {
    const citizenCookie = await registerAndLogin("citizen@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Overdue test issue")
      .field(
        "description",
        "This issue is deliberately backdated to test escalation",
      )
      .field("category", "Road Damage");

    await Issue.findByIdAndUpdate(createRes.body.issue._id, {
      "location.province": "Bagmati Province",
      "location.district": "Kathmandu",
    });
    await backdateDeadline(createRes.body.issue._id, 48);

    await registerAndLogin("ktmadmin@test.com");
    await User.findOneAndUpdate(
      { email: "ktmadmin@test.com" },
      {
        role: "admin",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );

    const result = await runEscalationCheck();

    expect(result.escalated).toBe(1);
    const updated = await Issue.findById(createRes.body.issue._id);
    expect(updated.escalated).toBe(true);
    expect(updated.escalatedAt).toBeTruthy();

    expect(sendEscalationEmail).toHaveBeenCalledTimes(1);
    const [notifiedAdmin] = sendEscalationEmail.mock.calls[0];
    expect(notifiedAdmin.email).toBe("ktmadmin@test.com");
  });

  it("never escalates a resolved issue, even if its deadline has passed", async () => {
    const citizenCookie = await registerAndLogin("citizen2@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Already resolved test issue")
      .field(
        "description",
        "This should not be escalated despite being overdue",
      )
      .field("category", "Garbage");

    await Issue.findByIdAndUpdate(createRes.body.issue._id, {
      status: "resolved",
    });
    await backdateDeadline(createRes.body.issue._id, 48);

    const result = await runEscalationCheck();
    expect(result.escalated).toBe(0);
  });

  it("does not re-escalate (or re-notify) an issue that was already escalated", async () => {
    const citizenCookie = await registerAndLogin("citizen3@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Already escalated test issue")
      .field(
        "description",
        "Should be skipped on a second sweep since already escalated",
      )
      .field("category", "Garbage");

    await backdateDeadline(createRes.body.issue._id, 48);
    await Issue.findByIdAndUpdate(createRes.body.issue._id, {
      escalated: true,
      escalatedAt: new Date(),
    });

    const result = await runEscalationCheck();
    expect(result.escalated).toBe(0);
    expect(sendEscalationEmail).not.toHaveBeenCalled();
  });

  it("does not escalate an issue whose deadline has not yet passed", async () => {
    const citizenCookie = await registerAndLogin("citizen4@test.com");
    await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Fresh test issue")
      .field("description", "Just created, well within its SLA window")
      .field("category", "Garbage")
      .field("priority", "low");

    const result = await runEscalationCheck();
    expect(result.escalated).toBe(0);
  });

  it("keeps escalated: false, sets escalationState: 'failed', and records the failure in escalationErrors if email delivery fails", async () => {
    // Mock email delivery failure
    sendEscalationEmail.mockRejectedValueOnce(new Error("SMTP Connection Timeout"));

    const citizenCookie = await registerAndLogin("citizen5@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Failed delivery test issue")
      .field("description", "This issue's email should fail and retry later")
      .field("category", "Road Damage");

    await Issue.findByIdAndUpdate(createRes.body.issue._id, {
      "location.province": "Bagmati Province",
      "location.district": "Kathmandu",
    });
    await backdateDeadline(createRes.body.issue._id, 48);

    await registerAndLogin("ktmadmin2@test.com");
    await User.findOneAndUpdate(
      { email: "ktmadmin2@test.com" },
      {
        role: "admin",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );

    // Run sweep - should return escalated: 0 because of delivery failure
    const result = await runEscalationCheck();
    expect(result.escalated).toBe(0);

    const updated = await Issue.findById(createRes.body.issue._id);
    expect(updated.escalated).toBe(false);
    expect(updated.escalationState).toBe("failed");
    expect(updated.escalationErrors.length).toBeGreaterThan(0);
    expect(updated.escalationErrors[0].error).toContain("SMTP Connection Timeout");

    // Mock recovery and run sweep again
    sendEscalationEmail.mockResolvedValueOnce(); // Now it succeeds
    const retryResult = await runEscalationCheck();
    expect(retryResult.escalated).toBe(1);

    const updatedAgain = await Issue.findById(createRes.body.issue._id);
    expect(updatedAgain.escalated).toBe(true);
    expect(updatedAgain.escalationState).toBe("completed");
  });

  it("skips notifications when another sweep already claimed the issue", async () => {
    const citizenCookie = await registerAndLogin("citizen6@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", citizenCookie)
      .field("title", "Claim race test issue")
      .field("description", "This issue is used to verify claim loss handling")
      .field("category", "Road Damage");

    await Issue.findByIdAndUpdate(createRes.body.issue._id, {
      "location.province": "Bagmati Province",
      "location.district": "Kathmandu",
    });
    await backdateDeadline(createRes.body.issue._id, 48);

    await registerAndLogin("ktmadmin3@test.com");
    await User.findOneAndUpdate(
      { email: "ktmadmin3@test.com" },
      {
        role: "admin",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );

    const claimSpy = vi.spyOn(Issue, "findOneAndUpdate").mockResolvedValueOnce(null);

    try {
      const result = await runEscalationCheck();
      expect(result.escalated).toBe(0);
      expect(sendEscalationEmail).not.toHaveBeenCalled();

      const updated = await Issue.findById(createRes.body.issue._id);
      expect(updated.escalated).toBe(false);
      expect(updated.escalationState).toBe("unmarked");
    } finally {
      claimSpy.mockRestore();
    }
  });
});
