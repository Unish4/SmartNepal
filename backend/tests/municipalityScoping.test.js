import { describe, it, expect, vi, beforeEach } from "vitest";
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
}));


const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return { cookie: res.headers["set-cookie"] };
};

const makeAdmin = async (email, jurisdiction) => {
  const { cookie } = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "admin", jurisdiction });
  return cookie;
};

const makeSuperAdmin = async (email) => {
  const { cookie } = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "super_admin" });
  return cookie;
};

// Creates a real issue through the API (exercising the actual route),
// then patches its location directly — sidesteps needing to seed the
// Boundary collection just to test authorization logic downstream of it.
const createIssueIn = async (citizenCookie, province, district) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", citizenCookie)
    .field("title", "Test issue for jurisdiction scoping")
    .field(
      "description",
      "A test issue used to verify municipality scoping works correctly",
    )
    .field("category", "Road Damage");
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
  });
  return res.body.issue._id;
};

describe("Municipality-scoped admin authorization", () => {
  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
    ]);
  });

  it("scopes getAllIssues to only the admin's own jurisdiction", async () => {
    const { cookie: citizen } = await registerAndLogin("citizen1@test.com");
    await createIssueIn(citizen, "Bagmati Province", "Kathmandu");
    await createIssueIn(citizen, "Gandaki Province", "Kaski");

    const ktmAdmin = await makeAdmin("ktmadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .get("/api/admin/issues")
      .set("Cookie", ktmAdmin);

    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBe(1);
    expect(res.body.issues[0].location.district).toBe("Kathmandu");
  });

  it("blocks a scoped admin from updating an issue outside their jurisdiction", async () => {
    const { cookie: citizen } = await registerAndLogin("citizen2@test.com");
    const pokharaIssueId = await createIssueIn(
      citizen,
      "Gandaki Province",
      "Kaski",
    );

    const ktmAdmin = await makeAdmin("ktmadmin2@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .patch(`/api/admin/issues/${pokharaIssueId}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "verified" });

    // The single most important assertion in this phase — the exact
    // equivalent of "citizen can't delete another citizen's report,"
    // now applied to an admin acting outside their own jurisdiction.
    expect(res.status).toBe(403);
  });

  it("allows a scoped admin to update an issue inside their jurisdiction", async () => {
    const { cookie: citizen } = await registerAndLogin("citizen3@test.com");
    const ktmIssueId = await createIssueIn(
      citizen,
      "Bagmati Province",
      "Kathmandu",
    );

    const ktmAdmin = await makeAdmin("ktmadmin3@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .patch(`/api/admin/issues/${ktmIssueId}/status`)
      .set("Cookie", ktmAdmin)
      .send({ status: "verified" });

    expect(res.status).toBe(200);
  });

  it("gives a super_admin visibility across every jurisdiction", async () => {
    const { cookie: citizen } = await registerAndLogin("citizen4@test.com");
    await createIssueIn(citizen, "Bagmati Province", "Kathmandu");
    await createIssueIn(citizen, "Gandaki Province", "Kaski");

    const superAdmin = await makeSuperAdmin("super@test.com");
    const res = await request(app)
      .get("/api/admin/issues")
      .set("Cookie", superAdmin);

    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBe(2);
  });

  it("fails closed — an admin with no jurisdiction assigned sees zero issues", async () => {
    const { cookie: citizen } = await registerAndLogin("citizen5@test.com");
    await createIssueIn(citizen, "Bagmati Province", "Kathmandu");

    const unconfiguredAdmin = await makeAdmin(
      "unconfigured@test.com",
      undefined,
    );
    const res = await request(app)
      .get("/api/admin/issues")
      .set("Cookie", unconfiguredAdmin);

    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBe(0);
  });

  it("only a super_admin can create new admin accounts", async () => {
    const ktmAdmin = await makeAdmin("regularadmin@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", ktmAdmin)
      .send({
        name: "New Admin",
        email: "newadmin@test.com",
        password: "password123",
        province: "Gandaki Province",
        district: "Kaski",
      });
    expect(res.status).toBe(403);
  });

  it("lets a super_admin create a new scoped admin account", async () => {
    const superAdmin = await makeSuperAdmin("super2@test.com");
    const res = await request(app)
      .post("/api/admin/admins")
      .set("Cookie", superAdmin)
      .send({
        name: "New Admin",
        email: "newadmin2@test.com",
        password: "password123",
        province: "Gandaki Province",
        district: "Kaski",
      });
    expect(res.status).toBe(201);
    expect(res.body.admin.jurisdiction.district).toBe("Kaski");
  });
});
