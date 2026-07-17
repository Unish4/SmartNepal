import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { generateSync } from "otplib";
const authenticator = {
  generate: (secret) => generateSync({ secret }),
};

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.user._id };
};
const makeAdmin = async (email, jurisdiction) => {
  const { cookie } = await registerAndLogin(email);
  await User.findOneAndUpdate({ email }, { role: "admin", jurisdiction });
  return { cookie };
};

describe("Two-factor authentication", () => {
  it("blocks admin routes until 2FA is set up for an admin-tier role", async () => {
    const { cookie } = await makeAdmin("blocked@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookie);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TWO_FACTOR_SETUP_REQUIRED");
  });

  it("never blocks a citizen from citizen-facing routes", async () => {
    const { cookie } = await registerAndLogin("citizen1@test.com");
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
  });

  it("completes setup with a real TOTP code and unblocks admin routes", async () => {
    const { cookie } = await makeAdmin("setup@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });

    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", cookie);
    const secret = setupRes.body.manualEntryKey;
    const code = authenticator.generate(secret);

    const verifyRes = await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.backupCodes.length).toBe(8);

    const statsRes = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", verifyRes.headers["set-cookie"] || cookie);
    expect(statsRes.status).toBe(200);
  });

  it("rejects an invalid code during setup verification", async () => {
    const { cookie } = await makeAdmin("badcode@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    await request(app).post("/api/auth/2fa/setup").set("Cookie", cookie);
    const res = await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code: "000000" });
    expect(res.status).toBe(400);
  });

  it("requires a second factor at login once 2FA is enabled — no cookie until then", async () => {
    const { cookie } = await makeAdmin("login2fa@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", cookie);
    const secret = setupRes.body.manualEntryKey;
    await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code: authenticator.generate(secret) });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "login2fa@test.com", password: "password123" });
    expect(loginRes.body.requiresTwoFactor).toBe(true);
    expect(loginRes.headers["set-cookie"]).toBeUndefined();

    const verifyLoginRes = await request(app)
      .post("/api/auth/2fa/login-verify")
      .send({
        pendingToken: loginRes.body.pendingToken,
        code: authenticator.generate(secret),
      });
    expect(verifyLoginRes.status).toBe(200);
    expect(verifyLoginRes.headers["set-cookie"]).toBeDefined();

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", verifyLoginRes.headers["set-cookie"]);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("login2fa@test.com");
  });

  it("rejects an incorrect code at the login-verify step", async () => {
    const { cookie } = await makeAdmin("wrongcode@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", cookie);
    await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code: authenticator.generate(setupRes.body.manualEntryKey) });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrongcode@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/2fa/login-verify")
      .send({ pendingToken: loginRes.body.pendingToken, code: "000000" });
    expect(res.status).toBe(401);
  });

  it("allows logging in with a backup code and marks it single-use", async () => {
    const { cookie } = await makeAdmin("backup@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", cookie);
    const verifySetupRes = await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code: authenticator.generate(setupRes.body.manualEntryKey) });
    const backupCode = verifySetupRes.body.backupCodes[0];

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "backup@test.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/2fa/login-verify")
      .send({ pendingToken: loginRes.body.pendingToken, code: backupCode });
    expect(res.status).toBe(200);
    expect(res.body.usedBackupCode).toBe(true);
    expect(res.body.backupCodesRemaining).toBe(7);

    const loginRes2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "backup@test.com", password: "password123" });
    const res2 = await request(app)
      .post("/api/auth/2fa/login-verify")
      .send({ pendingToken: loginRes2.body.pendingToken, code: backupCode });
    expect(res2.status).toBe(401); // the same backup code cannot be reused
  });

  it("requires the current password AND a valid code to disable 2FA", async () => {
    const { cookie } = await makeAdmin("disable@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const setupRes = await request(app)
      .post("/api/auth/2fa/setup")
      .set("Cookie", cookie);
    const secret = setupRes.body.manualEntryKey;
    await request(app)
      .post("/api/auth/2fa/verify-setup")
      .set("Cookie", cookie)
      .send({ code: authenticator.generate(secret) });

    const wrongPasswordRes = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Cookie", cookie)
      .send({
        password: "wrongpassword",
        code: authenticator.generate(secret),
      });
    expect(wrongPasswordRes.status).toBe(401);

    const res = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Cookie", cookie)
      .send({ password: "password123", code: authenticator.generate(secret) });
    expect(res.status).toBe(200);

    // Disabling re-triggers the setup-required gate immediately
    const statsRes = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", cookie);
    expect(statsRes.status).toBe(403);
  });
});
