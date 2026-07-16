import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";

vi.mock("../src/utils/uploadToCloudinary.js", () => ({
  uploadToCloudinary: vi
    .fn()
    .mockResolvedValue({
      secure_url: "https://res.cloudinary.com/fake/test.jpg",
    }),
}));
vi.mock("../src/services/aiService.js", () => ({
  categorizeIssue: vi.fn().mockResolvedValue(null),
  generateTitle: vi.fn().mockResolvedValue(null),
  findDuplicates: vi.fn().mockResolvedValue([]),
}));

const registerAndLogin = async (email) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Test", email, password: "password123" });
  return res.headers["set-cookie"];
};

const createIssue = async (cookie) => {
  const res = await request(app)
    .post("/api/issues")
    .set("Cookie", cookie)
    .field("title", "Comment test issue")
    .field("description", "A test issue used to verify comment thread behavior")
    .field("category", "Road Damage");
  return res.body.issue._id;
};

describe("Comments", () => {
  it("requires authentication to post a comment", async () => {
    const cookie = await registerAndLogin("citizen1@test.com");
    const issueId = await createIssue(cookie);
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .send({ text: "Anonymous comment" });
    expect(res.status).toBe(401);
  });

  it("allows a logged-in citizen to comment on any public issue", async () => {
    const ownerCookie = await registerAndLogin("owner@test.com");
    const issueId = await createIssue(ownerCookie);

    const commenterCookie = await registerAndLogin("commenter@test.com");
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", commenterCookie)
      .send({ text: "This is happening on my street too." });

    expect(res.status).toBe(201);
    expect(res.body.comment.text).toBe("This is happening on my street too.");
  });

  it("lists comments for an issue without requiring authentication", async () => {
    const ownerCookie = await registerAndLogin("owner2@test.com");
    const issueId = await createIssue(ownerCookie);
    await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", ownerCookie)
      .send({ text: "First comment" });

    const res = await request(app).get(`/api/issues/${issueId}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.comments.length).toBe(1);
  });

  it("rejects an empty comment", async () => {
    const cookie = await registerAndLogin("citizen2@test.com");
    const issueId = await createIssue(cookie);
    const res = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", cookie)
      .send({ text: "   " });
    expect(res.status).toBe(400);
  });

  it("allows the comment author to delete their own comment", async () => {
    const cookie = await registerAndLogin("citizen3@test.com");
    const issueId = await createIssue(cookie);
    const createRes = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", cookie)
      .send({ text: "Delete me" });

    const deleteRes = await request(app)
      .delete(`/api/issues/${issueId}/comments/${createRes.body.comment._id}`)
      .set("Cookie", cookie);
    expect(deleteRes.status).toBe(200);
  });

  it("blocks a different citizen from deleting someone else's comment", async () => {
    const authorCookie = await registerAndLogin("commentauthor@test.com");
    const issueId = await createIssue(authorCookie);
    const createRes = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", authorCookie)
      .send({ text: "Not yours to delete" });

    const otherCookie = await registerAndLogin("othercitizen@test.com");
    const deleteRes = await request(app)
      .delete(`/api/issues/${issueId}/comments/${createRes.body.comment._id}`)
      .set("Cookie", otherCookie);
    expect(deleteRes.status).toBe(403);
  });

  it("allows an admin to delete any comment regardless of jurisdiction", async () => {
    const authorCookie = await registerAndLogin("commentauthor2@test.com");
    const issueId = await createIssue(authorCookie);
    const createRes = await request(app)
      .post(`/api/issues/${issueId}/comments`)
      .set("Cookie", authorCookie)
      .send({ text: "Moderate this" });

    const adminCookie = await registerAndLogin("moderator@test.com");
    await User.findOneAndUpdate(
      { email: "moderator@test.com" },
      {
        role: "admin",
        jurisdiction: { province: "Bagmati Province", district: "Kathmandu" },
      },
    );

    const deleteRes = await request(app)
      .delete(`/api/issues/${issueId}/comments/${createRes.body.comment._id}`)
      .set("Cookie", adminCookie);
    expect(deleteRes.status).toBe(200);
  });
});
