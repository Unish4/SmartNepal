import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";

vi.mock("../src/utils/uploadToCloudinary.js", () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue({
    secure_url: "https://res.cloudinary.com/fake/test.jpg",
  }),
}));
vi.mock("../src/services/aiService.js", () => ({
  categorizeIssue: vi.fn().mockResolvedValue(null),
  generateTitle: vi.fn().mockResolvedValue(null),
  findDuplicates: vi.fn().mockResolvedValue([]),
}));

const registerAndLogin = async (email) => {
  const res = await request(app).post("/api/auth/register").send({
    name: "Test Citizen",
    email,
    password: "password123",
  });
  return res.headers["set-cookie"];
};

describe("Issue creation and ownership", () => {
  it("requires authentication to create an issue", async () => {
    const res = await request(app)
      .post("/api/issues")
      .field("title", "Pothole on main road")
      .field("description", "A large pothole has formed near the market")
      .field("category", "Road Damage");
    expect(res.status).toBe(401);
  });

  it("creates an issue when authenticated", async () => {
    const cookie = await registerAndLogin("citizen@test.com");
    const res = await request(app)
      .post("/api/issues")
      .set("Cookie", cookie)
      .field("title", "Pothole on main road")
      .field("description", "A large pothole has formed near the market")
      .field("category", "Road Damage")
      .field("priority", "high");

    expect(res.status).toBe(201);
    expect(res.body.issue.title).toBe("Pothole on main road");
    expect(res.body.issue.status).toBe("open");
  });

  it("prevents a citizen from deleting another citizen's issue", async () => {
    const ownerCookie = await registerAndLogin("owner@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", ownerCookie)
      .field("title", "Broken street light")
      .field("description", "Street light has been out for two weeks")
      .field("category", "Street Light");

    const otherCookie = await registerAndLogin("other@test.com");
    const deleteRes = await request(app)
      .delete(`/api/issues/${createRes.body.issue._id}`)
      .set("Cookie", otherCookie);

    // The single most important assertion in the whole suite — it's the
    // exact rule assertOwnership() enforces in issueController.js, and
    // the rule municipality scoping is most likely to
    // accidentally weaken if we build it without this test in place first.
    expect(deleteRes.status).toBe(403);
  });

  it("allows the owner to delete their own issue", async () => {
    const cookie = await registerAndLogin("owner2@test.com");
    const createRes = await request(app)
      .post("/api/issues")
      .set("Cookie", cookie)
      .field("title", "Overflowing garbage bin")
      .field(
        "description",
        "The bin near the temple has not been cleared in a week",
      )
      .field("category", "Garbage");

    const deleteRes = await request(app)
      .delete(`/api/issues/${createRes.body.issue._id}`)
      .set("Cookie", cookie);

    expect(deleteRes.status).toBe(200);
  });
});
