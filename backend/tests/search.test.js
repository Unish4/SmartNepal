import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
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

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const createIssue = async (cookie, title, province, district) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", cookie)
    .field("title", title)
    .field("description", "A test issue used to verify search behavior")
    .field("category", "Road Damage");
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
  });
  return res.body.issue._id;
};

describe("Issue search (regex fallback, since test env has ATLAS_SEARCH_ENABLED=false)", () => {
  it("finds an issue by a partial, case-insensitive word in its title", async () => {
    const cookie = await registerAndLogin("citizen1@test.com");
    await createIssue(cookie, "Large POTHOLE on Ring Road");

    const res = await request(app).get("/api/issues?search=pothole");
    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBe(1);
  });

  it("returns zero results for a search term that matches nothing, without erroring", async () => {
    const res = await request(app).get("/api/issues?search=xyzzy_no_match_123");
    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBe(0);
  });

  it("regression guard — citizens can still filter the public list by province/district after Phase 40's refactor", async () => {
    const cookie = await registerAndLogin("citizen2@test.com");
    await createIssue(
      cookie,
      "Kathmandu issue",
      "Bagmati Province",
      "Kathmandu",
    );
    await createIssue(cookie, "Pokhara issue", "Gandaki Province", "Kaski");

    const res = await request(app).get("/api/issues?district=Kathmandu");
    expect(res.body.issues.length).toBe(1);
    expect(res.body.issues[0].location.district).toBe("Kathmandu");
  });
});
