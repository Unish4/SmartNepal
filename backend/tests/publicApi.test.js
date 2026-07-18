import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Issue from "../src/models/Issue.js";

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
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
    .field("title", "Public API test issue")
    .field(
      "description",
      "A test issue used to verify the public read-only API surface",
    )
    .field("category", category);
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
  });
  return res.body.issue._id;
};

describe("Public API (v1)", () => {
  it("lists issues with no authentication required", async () => {
    const cookie = await registerAndLogin("citizen1@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");

    const res = await request(app).get("/api/public/v1/issues");
    expect(res.status).toBe(200);
    expect(res.body.issues.length).toBeGreaterThanOrEqual(1);
  });

  it("never returns the reporter's email, only their name", async () => {
    const cookie = await registerAndLogin("citizen2@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Lalitpur");

    const res = await request(app).get("/api/public/v1/issues");
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("citizen2@test.com");
    expect(res.body.issues.every((i) => !("email" in (i.author || {})))).toBe(
      true,
    );
  });

  it("caps the page size at 25 even if a larger limit is requested", async () => {
    const res = await request(app).get("/api/public/v1/issues?limit=500");
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(25);
  });

  it("filters by province and district, consistent with the Phase 40 fix", async () => {
    const cookie = await registerAndLogin("citizen3@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");
    await createIssueIn(cookie, "Gandaki Province", "Kaski");

    const res = await request(app).get(
      "/api/public/v1/issues?district=Kathmandu",
    );
    expect(
      res.body.issues.every((i) => i.location.district === "Kathmandu"),
    ).toBe(true);
  });

  it("returns a single public issue by ID with upvoteCount instead of a raw upvoterIds array", async () => {
    const cookie = await registerAndLogin("citizen4@test.com");
    const issueId = await createIssueIn(
      cookie,
      "Bagmati Province",
      "Bhaktapur",
    );

    const res = await request(app).get(`/api/public/v1/issues/${issueId}`);
    expect(res.status).toBe(200);
    expect(res.body.issue.upvoteCount).toBe(0);
    expect(res.body.issue).not.toHaveProperty("upvoterIds");
  });

  it("returns 404 for a well-formed but nonexistent issue ID", async () => {
    const res = await request(app).get(
      "/api/public/v1/issues/000000000000000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed issue ID rather than crashing", async () => {
    const res = await request(app).get("/api/public/v1/issues/not-a-real-id");
    expect(res.status).toBe(400);
  });

  it("lists the fixed category vocabulary", async () => {
    const res = await request(app).get("/api/public/v1/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toContain("Road Damage");
  });

  it("returns nationwide stats, unscoped by any single jurisdiction", async () => {
    const cookie = await registerAndLogin("citizen5@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");
    await createIssueIn(cookie, "Gandaki Province", "Kaski");

    const res = await request(app).get("/api/public/v1/stats");
    expect(res.status).toBe(200);
    expect(res.body.stats.totalIssues).toBeGreaterThanOrEqual(2);
  });
});
