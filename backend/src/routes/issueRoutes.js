import { Router } from "express";
import {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  upvoteIssue,
  getBoundaryOptions,
} from "../controllers/issueController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createIssueValidator,
  updateIssueValidator,
} from "../utils/validators.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// ── Non-parameterised routes ── must be before /:id ───────────────────────────
router.get("/", getIssues);
router.get("/me", protect, getMyIssues);
router.get("/boundaries", getBoundaryOptions);
router.post(
  "/",
  protect,
  upload.array("images", 3),
  createIssueValidator,
  createIssue,
);

// ── Parameterised routes — always last ────────────────────────────────────────
router.get("/:id", getIssueById);
router.put("/:id", protect, updateIssueValidator, updateIssue);
router.delete("/:id", protect, deleteIssue);
router.post("/:id/upvote", protect, upvoteIssue);

export default router;
