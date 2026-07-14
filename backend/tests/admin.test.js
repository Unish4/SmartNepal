import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";

const registerAndLogin = async (email, role = "citizen") => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "password123",
  });
  // Simulates the manual Atlas role edit used in real admin onboarding —
  // there is no public API to self-promote to admin, by design.
  if (role !== "citizen") {
    await User.findOneAndUpdate({ email }, { role });
  }
  return res.headers["set-cookie"];
};

describe("Admin route protection", () => {
  it("blocks a citizen from the admin stats endpoint", async () => {
    const cookie = await registerAndLogin("citizen@test.com");
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
  });

  it("blocks an unauthenticated request entirely", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("allows an admin through", async () => {
    const cookie = await registerAndLogin("admin@test.com", "admin");
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });
});
