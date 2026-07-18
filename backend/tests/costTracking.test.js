import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Issue from "../src/models/Issue.js";
import { generateSync } from "otplib";

const authenticator = {
  generate: (secret) => generateSync({ secret }),
};

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

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

// Admin/field_worker routes are gated by Phase 36's 2FA requirement —
// this helper completes that flow once so the cost-tracking assertions
// below stay focused on cost logic, not the auth dance.
const makeAdminWithTwoFactor = async (email, jurisdiction) => {
  const cookie = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "admin", jurisdiction });
  const setupRes = await request(app)
    .post("/api/auth/2fa/setup")
    .set("Cookie", cookie);
  const secret = setupRes.body.manualEntryKey;
  const verifyRes = await request(app)
    .post("/api/auth/2fa/verify-setup")
    .set("Cookie", cookie)
    .send({ code: authenticator.generate(secret) });
  return verifyRes.headers["set-cookie"] || cookie;
};

const createIssueIn = async (
  cookie,
  province,
  district,
  category = "Road Damage",
) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", cookie)
    .field("title", "Cost tracking test issue")
    .field(
      "description",
      "A test issue used to verify resolution cost tracking",
    )
    .field("category", category);
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
  });
  return res.body.issue._id;
};

describe("Resolution cost tracking", () => {
  it("records resolutionCost when an admin resolves an issue with a cost provided", async () => {
    const citizenCookie = await registerAndLogin("citizen1@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );

    const adminCookie = await makeAdminWithTwoFactor("admin1@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .patch(`/api/admin/issues/${issueId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "resolved", resolutionCost: 2500 });

    expect(res.status).toBe(200);
    const issue = await Issue.findById(issueId);
    expect(issue.resolutionCost).toBe(2500);
  });

  it("rejects a negative resolution cost", async () => {
    const citizenCookie = await registerAndLogin("citizen2@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );
    const adminCookie = await makeAdminWithTwoFactor("admin2@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });

    const res = await request(app)
      .patch(`/api/admin/issues/${issueId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "resolved", resolutionCost: -500 });
    expect(res.status).toBe(400);
  });

  it("allows resolving without a cost — it remains genuinely optional", async () => {
    const citizenCookie = await registerAndLogin("citizen3@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );
    const adminCookie = await makeAdminWithTwoFactor("admin3@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });

    const res = await request(app)
      .patch(`/api/admin/issues/${issueId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "resolved" });
    expect(res.status).toBe(200);
    const issue = await Issue.findById(issueId);
    expect(issue.resolutionCost).toBeUndefined();
  });

  it.each([
    ["false", false, 400],
    ["null", null, 400],
    ["empty string", "", 200],
  ])(
    "%s resolution cost handling",
    async (_label, resolutionCost, expectedStatus) => {
      const citizenCookie = await registerAndLogin("citizen3b@test.com");
      const issueId = await createIssueIn(
        citizenCookie,
        "Bagmati Province",
        "Kathmandu",
      );
      const adminCookie = await makeAdminWithTwoFactor("admin3b@test.com", {
        province: "Bagmati Province",
        district: "Kathmandu",
      });

      const res = await request(app)
        .patch(`/api/admin/issues/${issueId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "resolved", resolutionCost });

      expect(res.status).toBe(expectedStatus);

      if (expectedStatus === 200) {
        const issue = await Issue.findById(issueId);
        expect(issue.resolutionCost).toBeUndefined();
      }
    },
  );

  it("aggregates cost by category in analytics, correctly scoped per jurisdiction", async () => {
    const citizenCookie = await registerAndLogin("citizen4@test.com");
    const ktmIssue = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
      "Road Damage",
    );
    const pokharaIssue = await createIssueIn(
      citizenCookie,
      "Gandaki Province",
      "Kaski",
      "Road Damage",
    );

    const ktmAdmin = await makeAdminWithTwoFactor("ktmadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    await request(app)
      .patch(`/api/admin/issues/${ktmIssue}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "resolved", resolutionCost: 1000 });

    const pokharaAdmin = await makeAdminWithTwoFactor("pokharaadmin@test.com", {
      province: "Gandaki Province",
      district: "Kaski",
    });
    await request(app)
      .patch(`/api/admin/issues/${pokharaIssue}/status`)
      .set("Cookie", pokharaAdmin)
      .send({ status: "resolved", resolutionCost: 5000 });

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", ktmAdmin);
    expect(res.status).toBe(200);
    // Scoped strictly to Kathmandu — Pokhara's 5000 must never leak in,
    // the same jurisdiction boundary Phase 27 established everywhere else.
    expect(res.body.analytics.totalCost).toBe(1000);
    const roadDamage = res.body.analytics.costByCategory.find(
      (c) => c.category === "Road Damage",
    );
    expect(roadDamage.totalCost).toBe(1000);
  });

  it("records resolutionCost from a field worker's multipart resolve request", async () => {
    const citizenCookie = await registerAndLogin("citizen5@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );

    const fwCookieRegister = await registerAndLogin("fieldworker1@test.com");
    await User.findOneAndUpdate(
      { email: "fieldworker1@test.com" },
      {
        role: "field_worker",
        department: "Road Maintenance",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );
    const fwSetupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", fwCookieRegister);
    const fwSecret = fwSetupRes.body.manualEntryKey;
    const fwVerifyRes = await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", fwCookieRegister)
      .send({ code: authenticator.generate(fwSecret) });
    const fwCookie = fwVerifyRes.headers["set-cookie"] || fwCookieRegister;

    const admin = await makeAdminWithTwoFactor("assigningadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const fieldWorker = await User.findOne({ email: "fieldworker1@test.com" });
    await request(app)
      .patch(`/api/admin/issues/${issueId}/assign`)
      .set("Cookie", admin)
      .send({ fieldWorkerId: fieldWorker._id });

    await request(app)
      .patch(`/api/field/assignments/${issueId}/status`)
      .set("Cookie", fwCookie)
      .send({ status: "in-progress" });

    const resolveRes = await request(app)
      .patch(`/api/field/assignments/${issueId}/status`)
      .set("Cookie", fwCookie)
      .field("status", "resolved")
      .field("cost", "3200")
      .attach("proof", Buffer.from("fake image bytes"), "proof.jpg");

    expect(resolveRes.status).toBe(200);
    const issue = await Issue.findById(issueId);
    expect(issue.resolutionCost).toBe(3200);
  });
});
