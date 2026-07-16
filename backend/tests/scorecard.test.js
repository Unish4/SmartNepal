import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Issue from "../src/models/Issue.js";
import User from "../src/models/User.js";

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const createIssueIn = async (cookie, province, district, status = "open") => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", cookie)
    .field("title", "Scorecard test issue")
    .field(
      "description",
      "A test issue used to verify public scorecard aggregation",
    )
    .field("category", "Road Damage");
  await Issue.findByIdAndUpdate(res.body.issue._id, {
    "location.province": province,
    "location.district": district,
    status,
  });
  return res.body.issue._id;
};

describe("Public scorecard", () => {
  afterEach(async () => {
    await Promise.all([
      Issue.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  it("requires no authentication at all", async () => {
    const res = await request(app).get(
      "/api/public/scorecard/Bagmati%20Province/Kathmandu",
    );
    expect(res.status).toBe(200);
  });

  it("flags insufficient data below the minimum sample size", async () => {
    const cookie = await registerAndLogin("citizen1@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");

    const res = await request(app).get(
      "/api/public/scorecard/Bagmati%20Province/Kathmandu",
    );
    expect(res.body.scorecard.hasEnoughData).toBe(false);
    expect(res.body.scorecard.totalIssues).toBe(2);
  });

  it("computes an accurate resolution rate once past the minimum sample size", async () => {
    const cookie = await registerAndLogin("citizen2@test.com");
    for (let i = 0; i < 8; i++)
      await createIssueIn(cookie, "Gandaki Province", "Kaski", "resolved");
    for (let i = 0; i < 4; i++)
      await createIssueIn(cookie, "Gandaki Province", "Kaski", "open");

    const res = await request(app).get(
      "/api/public/scorecard/Gandaki%20Province/Kaski",
    );
    expect(res.body.scorecard.hasEnoughData).toBe(true);
    expect(res.body.scorecard.totalIssues).toBe(12);
    expect(res.body.scorecard.resolutionRate).toBeCloseTo(66.7, 1);
  });

  it("scopes strictly to the requested district and never leaks another district's data", async () => {
    const cookie = await registerAndLogin("citizen3@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Kathmandu");
    await createIssueIn(cookie, "Bagmati Province", "Lalitpur");

    const res = await request(app).get(
      "/api/public/scorecard/Bagmati%20Province/Kathmandu",
    );
    expect(res.body.scorecard.totalIssues).toBe(1);
  });

  it("never returns individual issue details, only aggregates", async () => {
    const cookie = await registerAndLogin("citizen4@test.com");
    await createIssueIn(cookie, "Bagmati Province", "Bhaktapur");

    const res = await request(app).get(
      "/api/public/scorecard/Bagmati%20Province/Bhaktapur",
    );
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("Scorecard test issue"); // the issue title must never appear
    expect(res.body.scorecard).not.toHaveProperty("issues");
  });

  it("supports a province-level query with no district, aggregating across the whole province", async () => {
    const cookie = await registerAndLogin("citizen5@test.com");
    await createIssueIn(cookie, "Karnali Province", "Surkhet");
    await createIssueIn(cookie, "Karnali Province", "Dailekh");

    const res = await request(app).get(
      "/api/public/scorecard/Karnali%20Province",
    );
    expect(res.body.scorecard.totalIssues).toBe(2);
    expect(res.body.scorecard.district).toBeNull();
  });

  it("lists only provinces/districts that actually have data in the directory", async () => {
    const cookie = await registerAndLogin("citizen6@test.com");
    await createIssueIn(cookie, "Sudurpashchim Province", "Kailali");

    const res = await request(app).get("/api/public/scorecard-directory");
    expect(res.status).toBe(200);
    expect(res.body.directory.some((d) => d.district === "Kailali")).toBe(true);
    expect(res.body.directory.some((d) => d.district === "Kaski")).toBe(false);
    expect(res.body.directory.every((d) => d.district && d.district !== "null" && d.district !== "undefined" && d.district !== "")).toBe(true);
    expect(res.body.directory.every((d) => d.province && d.province !== "null" && d.province !== "undefined" && d.province !== "")).toBe(true);
  });
});
