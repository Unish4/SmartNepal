import { Router } from "express";
import {
  getDashboardStats,
  getAllIssues,
  updateIssueStatus,
  getAllUsers,
} from "../controllers/adminController.js";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";
import { statusUpdateValidator } from "../utils/validators.js";
import { validationResult } from "express-validator";

const router = Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }
  next();
};

router.use(protect, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/issues", getAllIssues);
router.get("/users", getAllUsers);
router.get("/analytics", getAnalytics);

router.patch(
  "/issues/:id/status",
  statusUpdateValidator,
  validate,
  updateIssueStatus,
);

export default router;
