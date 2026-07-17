import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import PushSubscription from "../src/models/PushSubscription.js";

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return { cookie: res.headers["set-cookie"], userId: res.body.user._id };
};

describe("Web push subscriptions", () => {
  it("returns the VAPID public key without requiring auth", async () => {
    const res = await request(app).get("/api/push/vapid-public-key");
    expect(res.status).toBe(200);
  });

  it("requires authentication to subscribe", async () => {
    const res = await request(app)
      .post("/api/push/subscribe")
      .send({
        endpoint: "https://fcm.googleapis.com/fake-endpoint",
        keys: { p256dh: "fakeKey", auth: "fakeAuth" },
      });
    expect(res.status).toBe(401);
  });

  it("creates a subscription for the logged-in user", async () => {
    const { cookie, userId } = await registerAndLogin("pushuser@test.com");
    const res = await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", cookie)
      .send({
        endpoint: "https://fcm.googleapis.com/fake-endpoint-1",
        keys: { p256dh: "fakeKey", auth: "fakeAuth" },
      });
    expect(res.status).toBe(200);
    const stored = await PushSubscription.findOne({
      endpoint: "https://fcm.googleapis.com/fake-endpoint-1",
    });
    expect(stored.user.toString()).toBe(userId.toString());
  });

  it("re-subscribing the same endpoint updates rather than duplicates", async () => {
    const { cookie } = await registerAndLogin("pushuser2@test.com");
    const payload = {
      endpoint: "https://fcm.googleapis.com/fake-endpoint-2",
      keys: { p256dh: "fakeKey", auth: "fakeAuth" },
    };
    await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", cookie)
      .send(payload);
    await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", cookie)
      .send(payload);

    const count = await PushSubscription.countDocuments({
      endpoint: payload.endpoint,
    });
    expect(count).toBe(1);
  });

  it("removes a subscription on unsubscribe", async () => {
    const { cookie } = await registerAndLogin("pushuser3@test.com");
    const endpoint = "https://fcm.googleapis.com/fake-endpoint-3";
    await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", cookie)
      .send({
        endpoint,
        keys: { p256dh: "fakeKey", auth: "fakeAuth" },
      });
    await request(app)
      .post("/api/push/unsubscribe")
      .set("Cookie", cookie)
      .send({ endpoint });

    const stored = await PushSubscription.findOne({ endpoint });
    expect(stored).toBeNull();
  });

  it("rejects malicious/invalid endpoints during subscribe", async () => {
    const { cookie } = await registerAndLogin("pushuser4@test.com");

    const badEndpoints = [
      "http://fcm.googleapis.com/fake-endpoint",
      "https://user:password@fcm.googleapis.com/fake-endpoint",
      "https://127.0.0.1/fake-endpoint",
      "https://localhost/fake-endpoint",
      "https://malicious-domain.com/fake-endpoint",
      "not-a-valid-url"
    ];

    for (const endpoint of badEndpoints) {
      const res = await request(app)
        .post("/api/push/subscribe")
        .set("Cookie", cookie)
        .send({
          endpoint,
          keys: { p256dh: "fakeKey", auth: "fakeAuth" },
        });
      expect(res.status).toBe(400);
    }
  });

  it("rejects registering the same endpoint for two different users", async () => {
    const user1 = await registerAndLogin("pushuser5@test.com");
    const user2 = await registerAndLogin("pushuser6@test.com");
    const endpoint = "https://fcm.googleapis.com/shared-endpoint";

    // User 1 successfully subscribes
    const res1 = await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", user1.cookie)
      .send({
        endpoint,
        keys: { p256dh: "fakeKey1", auth: "fakeAuth1" },
      });
    expect(res1.status).toBe(200);

    // User 2 attempts to subscribe using the same endpoint
    const res2 = await request(app)
      .post("/api/push/subscribe")
      .set("Cookie", user2.cookie)
      .send({
        endpoint,
        keys: { p256dh: "fakeKey2", auth: "fakeAuth2" },
      });
    expect(res2.status).toBe(409);
  });
});
