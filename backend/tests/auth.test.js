import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Auth flow", () => {
  const validUser = {
    name: "Sita Gurung",
    email: "sita@example.com",
    password: "password123",
  };

  it("registers a new citizen account and sets an httpOnly cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validUser.email);
    // The password hash must NEVER appear in an API response — this
    // guards the exact mistake that would leak credential material into
    // the frontend Zustand store and localStorage.
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.status).toBe(409);
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("logs in and can access a protected route using the returned cookie", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(validUser);
    const cookie = registerRes.headers["set-cookie"];

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(validUser.email);
  });

  it("blocks /me entirely without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
