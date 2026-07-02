import { Router } from "express";
import {
  createIssue,
  getIssues,
  getIssueById,
} from "../controllers/issueController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createIssueValidator } from "../utils/validators.js";

const router = Router();

//  Public routes
router.get("/", getIssues);

//  Protected routes (no params)
router.post("/", protect, createIssueValidator, createIssue);

//  Parameterized routes — always last
router.get("/:id", getIssueById);

export default router;
