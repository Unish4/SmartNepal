import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Boundary from "../src/models/Boundary.js";
import { generateSync } from "otplib";

const authenticator = {
  generate: (secret) => generateSync({ secret }),
};

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const makeFieldWorkerWithTwoFactor = async (email, jurisdiction) => {
  const cookie = await registerAndLogin(email);
  await User.findOneAndUpdate(
    { email },
    { role: "field_worker", jurisdiction, department: "Road Maintenance" },
  );
  const setupRes = await request(app)
    .post("/api/auth/2fa/setup")
    .set("Cookie", cookie);
  const secret = setupRes.body.manualEntryKey;
  const verifyRes = await request(app)
    .post("/api/auth/2fa/verify-setup")
    .set("Cookie", cookie)
    .send({ code: authenticator.generate(secret) });
  return verifyRes.headers["set-cookie"] || cookie;
};

const sampleDistrictPolygon = {
  type: "Polygon",
  coordinates: [
    [
      [85.22, 27.62],
      [85.5, 27.62],
      [85.5, 27.82],
      [85.22, 27.82],
      [85.22, 27.62],
    ],
  ],
};

describe("Offline map bounds", () => {
  it("blocks the route entirely for an unauthenticated request", async () => {
    const res = await request(app).get("/api/field/offline-map-bounds");
    expect(res.status).toBe(401);
  });

  it("returns 400 for a field worker with no jurisdiction assigned", async () => {
    const cookie = await makeFieldWorkerWithTwoFactor(
      "nojuris@test.com",
      undefined,
    );
    const res = await request(app)
      .get("/api/field/offline-map-bounds")
      .set("Cookie", cookie);
    expect(res.status).toBe(400);
  });

  it("returns 404 when no matching boundary exists for the assigned district", async () => {
    const cookie = await makeFieldWorkerWithTwoFactor("noboundary@test.com", {
      province: "Bagmati Province",
      district: "SomeUnseededDistrict",
    });
    const res = await request(app)
      .get("/api/field/offline-map-bounds")
      .set("Cookie", cookie);
    expect(res.status).toBe(404);
  });

  it("computes an accurate bounding box from a district's stored geometry", async () => {
    await Boundary.create({
      name: "Kathmandu",
      type: "district",
      parentName: "Bagmati Province",
      geometry: sampleDistrictPolygon,
    });

    const cookie = await makeFieldWorkerWithTwoFactor("withboundary@test.com", {
      province: "Bagmati Province",
      district: "Kathmandu",
    });
    const res = await request(app)
      .get("/api/field/offline-map-bounds")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.label).toBe("Kathmandu");
    expect(res.body.bbox.minLat).toBeCloseTo(27.62, 2);
    expect(res.body.bbox.maxLat).toBeCloseTo(27.82, 2);
    expect(res.body.bbox.minLng).toBeCloseTo(85.22, 2);
    expect(res.body.bbox.maxLng).toBeCloseTo(85.5, 2);
  });

  it("falls back to the province boundary when no district is set", async () => {
    await Boundary.create({
      name: "Bagmati Province",
      type: "province",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [84.5, 26.8],
            [86.7, 26.8],
            [86.7, 27.9],
            [84.5, 27.9],
            [84.5, 26.8],
          ],
        ],
      },
    });

    const cookie = await makeFieldWorkerWithTwoFactor("provinceonly@test.com", {
      province: "Bagmati Province",
    });
    const res = await request(app)
      .get("/api/field/offline-map-bounds")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.label).toBe("Bagmati Province");
  });
});
