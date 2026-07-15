import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Issue from "../src/models/Issue.js";

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


const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};
const makeAdmin = async (email, jurisdiction) => {
  const cookie = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "admin", jurisdiction });
  return cookie;
};
const makeSuperAdmin = async (email) => {
  const cookie = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "super_admin" });
  return cookie;
};
const createIssueIn = async (citizenCookie, province, district) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", citizenCookie)
    .field("title", "Audit log test issue")
    .field(
      "description",
      "A test issue used to verify audit logging works correctly",
    )
    .field("category", "Road Damage");
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
  });
  return res.body.issue._id;
};

describe("Audit logging", () => {
  it("records a status change and scopes it to the correct jurisdiction", async () => {
    const citizenCookie = await registerAndLogin("citizen1@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );

    const ktmAdmin = await makeAdmin("ktmadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    await request(app)
      .patch(`/api/admin/issues/${issueId}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "verified" });

    const logRes = await request(app)
      .get("/api/admin/audit-log")
      .set("Cookie", ktmAdmin);
    expect(logRes.status).toBe(200);
    expect(logRes.body.logs.length).toBe(1);
    expect(logRes.body.logs[0].action).toBe("issue_status_change");
    expect(logRes.body.logs[0].details.to).toBe("verified");
  });

  it("does not show a Kathmandu admin an audit entry from another district", async () => {
    const citizenCookie = await registerAndLogin("citizen2@test.com");
    const pokharaIssueId = await createIssueIn(
      citizenCookie,
      "Gandaki Province",
      "Kaski",
    );

    const pokharaAdmin = await makeAdmin("pokharaadmin@test.com", {
      province: "Gandaki Province",
      district: "Kaski",
    });
    await request(app)
      .patch(`/api/admin/issues/${pokharaIssueId}/status`)
      .set("Cookie", pokharaAdmin)
      .send({ status: "verified" });

    const ktmAdmin = await makeAdmin("ktmadmin2@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const logRes = await request(app)
      .get("/api/admin/audit-log")
      .set("Cookie", ktmAdmin);
    expect(logRes.body.logs.length).toBe(0);
  });

  it("lets a super_admin see audit entries across every jurisdiction", async () => {
    const citizenCookie = await registerAndLogin("citizen3@test.com");
    const ktmIssueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );
    const pokharaIssueId = await createIssueIn(
      citizenCookie,
      "Gandaki Province",
      "Kaski",
    );

    const ktmAdmin = await makeAdmin("ktmadmin3@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    await request(app)
      .patch(`/api/admin/issues/${ktmIssueId}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "verified" });

    const pokharaAdmin = await makeAdmin("pokharaadmin2@test.com", {
      province: "Gandaki Province",
      district: "Kaski",
    });
    await request(app)
      .patch(`/api/admin/issues/${pokharaIssueId}/status`)
      .set("Cookie", pokharaAdmin)
      .send({ status: "verified" });

    const superAdmin = await makeSuperAdmin("super@test.com");
    const logRes = await request(app)
      .get("/api/admin/audit-log")
      .set("Cookie", superAdmin);
    expect(logRes.body.logs.length).toBe(2);
  });

  it("blocks a cross-jurisdiction admin from deleting a citizen's issue (Phase 27 gap fix)", async () => {
    const citizenCookie = await registerAndLogin("citizen4@test.com");
    const pokharaIssueId = await createIssueIn(
      citizenCookie,
      "Gandaki Province",
      "Kaski",
    );

    const ktmAdmin = await makeAdmin("ktmadmin4@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .delete(`/api/issues/${pokharaIssueId}`)
      .set("Cookie", ktmAdmin);

    expect(res.status).toBe(403);
  });

  it("logs an admin-initiated deletion of a citizen's issue within their jurisdiction", async () => {
    const citizenCookie = await registerAndLogin("citizen5@test.com");
    const issueId = await createIssueIn(
      citizenCookie,
      "Bagmati Province",
      "Kathmandu",
    );

    const ktmAdmin = await makeAdmin("ktmadmin5@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const deleteRes = await request(app)
      .delete(`/api/issues/${issueId}`)
      .set("Cookie", ktmAdmin);
    expect(deleteRes.status).toBe(200);

    const logRes = await request(app)
      .get("/api/admin/audit-log")
      .set("Cookie", ktmAdmin);
    expect(logRes.body.logs.some((l) => l.action === "issue_deletion")).toBe(
      true,
    );
  });
});
