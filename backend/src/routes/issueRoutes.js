import { Router } from "express";
import {
  createIssue, getIssues, getMyIssues, getIssueById,
  updateIssue, deleteIssue, upvoteIssue,
} from "../controllers/issueController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createIssueValidator, updateIssueValidator } from "../utils/validators.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// ── Non-parameterised routes ── must be before /:id ───────────────────────────
router.get("/",   getIssues);
router.get ("/me", protect, getMyIssues);
router.post("/",  protect, upload.array("images", 3), createIssueValidator, createIssue);

// ── Parameterised routes — always last ────────────────────────────────────────
router.get    ("/:id",        getIssueById);
router.put    ("/:id",        protect, updateIssueValidator, updateIssue);
router.delete ("/:id",        protect, deleteIssue);
// POST /:id/upvote — the sub-path "/upvote" makes Express match this BEFORE
// GET /:id, so "upvote" is never mistaken for an issue _id.
router.post   ("/:id/upvote", protect, upvoteIssue);

export default router;