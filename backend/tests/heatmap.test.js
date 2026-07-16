import { describe, it, expect } from "vitest";import mongoose from "mongoose";
import app from "../src/app.js";
import Issue from "../src/models/Issue.js";
import mongoose from "mongoose";

const registerAndLogin = async (email) => {
  const res = await request(app).post("/api/auth/register").send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const createIssueAt = async (cookie, lat, lng, category = "Road Damage") => {
  const res = await request(app).post("/api/issues").set("Cookie", cookie)
    .field("title", "Heatmap test issue")
    .field("description", "A test issue used to verify heatmap aggregation")
    .field("category", category)
    .field("lat", String(lat))
    .field("lng", String(lng));
  return res.body.issue._id;
};

describe("Heatmap data", () => {
  it("requires no authentication", async () => {
    const res = await request(app).get("/api/issues/heatmap");
    expect(res.status).toBe(200);
  });

  it("returns lat/lng/weight points for issues that have coordinates", async () => {
    const cookie = await registerAndLogin("citizen1@test.com");
    await createIssueAt(cookie, 27.7172, 85.3240);

    const res = await request(app).get("/api/issues/heatmap");
    expect(res.body.points.length).toBeGreaterThanOrEqual(1);
    const point = res.body.points.find((p) => p.lat === 27.7172);
    expect(point).toBeTruthy();
    expect(point.weight).toBe(1); 
  });

  it("excludes issues with no coordinates set", async () => {
    const cookie = await registerAndLogin("citizen2@test.com");
    await request(app).post("/api/issues").set("Cookie", cookie)
      .field("title", "No location issue")
      .field("description", "This issue was created without a map pin at all")
      .field("category", "Garbage");

    const res = await request(app).get("/api/issues/heatmap");
    expect(res.body.points.every((p) => p.lat != null && p.lng != null)).toBe(true);
  });

  it("filters by category", async () => {
    const cookie = await registerAndLogin("citizen3@test.com");
    await createIssueAt(cookie, 28.2, 84.0, "Water Issue");
    await createIssueAt(cookie, 28.3, 84.1, "Garbage");

    const res = await request(app)
      .get("/api/issues/heatmap")
      .query({ category: "Water Issue" });
    expect(res.body.points.some((p) => p.lat === 28.2)).toBe(true);
    expect(res.body.points.some((p) => p.lat === 28.3)).toBe(false);
  });
  it("caps a single issue's weight so one popular report can't dominate the map", async () => {
    const cookie = await registerAndLogin("citizen4@test.com");
    const issueId = await createIssueAt(cookie, 27.7, 85.3);

    const fakeUpvoterIds = Array.from({ length: 15 }, () => new mongoose.Types.ObjectId());import request from "supertest";
    await Issue.findByIdAndUpdate(issueId, { upvoterIds: fakeUpvoterIds });

    const res = await request(app).get("/api/issues/heatmap");
    const point = res.body.points.find((p) => p.lat === 27.7);
    expect(point.weight).toBe(10); // capped, not 16
  });

  it("never returns titles, descriptions, or author info — aggregate only", async () => {
    const cookie = await registerAndLogin("citizen5@test.com");
    await createIssueAt(cookie, 27.68, 85.32);

    const res = await request(app).get("/api/issues/heatmap");
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("Heatmap test issue");
    expect(res.body.points[0]).not.toHaveProperty("title");
    expect(res.body.points[0]).not.toHaveProperty("author");
  });
});