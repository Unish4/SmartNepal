import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("OpenAPI documentation", () => {
  it("serves a valid OpenAPI JSON document", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("NepalSewa API");
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(20);
  });

  it("documents the new Phase 43 public API endpoints", async () => {
    const res = await request(app).get("/api/openapi.json");
    expect(res.body.paths).toHaveProperty("/api/public/v1/issues");
    expect(res.body.paths).toHaveProperty("/api/public/v1/stats");
  });

  it("serves the interactive Swagger UI page", async () => {
    const res = await request(app).get("/api/docs/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });
});
