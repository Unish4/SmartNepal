import { Router } from "express";
import {
  getDashboardStats,
  getAllIssues,
  updateIssueStatus,
  getAllUsers,
  createFieldWorker,
  getFieldWorkers,
  assignIssue,
} from "../controllers/adminController.js";
import {
  createAdmin,
  getAdmins,
  updateAdminJurisdiction,
} from "../controllers/adminManagementController.js";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect, requireAdmin, requireSuperAdmin } from "../middleware/authMiddleware.js";
import {
  statusUpdateValidator,
  createFieldWorkerValidator,
  assignIssueValidator,
  createAdminValidator,
  updateAdminJurisdictionValidator,
} from "../utils/validators.js";
import { scopeToMunicipality } from "../middleware/jurisdiction.js";
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

router.use(protect, requireAdmin, scopeToMunicipality);

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

router.post(
  "/field-workers",
  createFieldWorkerValidator,
  validate,
  createFieldWorker,
);
router.get("/field-workers", getFieldWorkers);
router.patch("/issues/:id/assign", assignIssueValidator, validate, assignIssue);

router.post(
  "/admins",
  requireSuperAdmin,
  createAdminValidator,
  validate,
  createAdmin,
);
router.get("/admins", requireSuperAdmin, getAdmins);
router.patch(
  "/admins/:id/jurisdiction",
  requireSuperAdmin,
  updateAdminJurisdictionValidator,
  validate,
  updateAdminJurisdiction,
);

export default router;
