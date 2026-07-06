import { Router } from "express";
import { body } from "express-validator";
import {
  getDashboardStats,
  getAllIssues,
  updateIssueStatus,
  getAllUsers,
} from "../controllers/adminController.js";
import { getAnalytics } from "../controllers/analyticsController.js"; 
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/issues", getAllIssues);
router.get("/users", getAllUsers);
router.get("/analytics", getAnalytics);

router.patch(
  "/issues/:id/status",
  [
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["open", "verified", "in-progress", "resolved", "rejected"])
      .withMessage("Invalid status value"),

    body("rejectionReason")
      .if(body("status").equals("rejected"))
      .trim()
      .notEmpty()
      .withMessage("Rejection reason is required when rejecting an issue"),
  ],
  updateIssueStatus,
);

export default router;
