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
  createCommentValidator,
} from "../utils/validators.js";
import { upload } from "../middleware/upload.js";
import { issueCreateArcjet, commentArcjet } from "../config/arcjet.js";
import {
  getComments,
  createComment,
  deleteComment,
} from "../controllers/commentController.js"; 
import { arcjetGuard } from "../middleware/arcjetMiddleware.js";
import { getHeatmapData } from "../controllers/issueController.js"; 

const router = Router();

// ── Non-parameterised routes ── must be before /:id ───────────────────────────
router.get("/", getIssues);
router.get("/me", protect, getMyIssues);
router.get("/boundaries", getBoundaryOptions);
router.post(
  "/",
  protect,
  arcjetGuard(issueCreateArcjet),
  upload.array("images", 3),
  createIssueValidator,
  createIssue,
);
router.get("/heatmap", getHeatmapData);

// ── Parameterised routes — always last
router.get("/:id", getIssueById);
router.put("/:id", protect, updateIssueValidator, updateIssue);
router.delete("/:id", protect, deleteIssue);
router.post("/:id/upvote", protect, upvoteIssue);

router.get("/:id/comments", getComments);
router.post(
  "/:id/comments",
  protect,
  arcjetGuard(commentArcjet),
  createCommentValidator,
  createComment,
);
router.delete("/:id/comments/:commentId", protect, deleteComment);

export default router;
