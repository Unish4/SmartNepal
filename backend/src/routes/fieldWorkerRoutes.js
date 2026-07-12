import { Router } from "express";
import { validationResult } from "express-validator";
import {
  getMyAssignments,
  getFieldStats,
  updateAssignmentStatus,
} from "../controllers/fieldWorkerController.js";
import { protect, requireFieldWorker } from "../middleware/authMiddleware.js";
import { fieldStatusUpdateValidator } from "../utils/validators.js";
import {
  cleanupUploadedFiles,
  proofUpload,
} from "../middleware/upload.js";

const router = Router();

const validate = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    await cleanupUploadedFiles(req.files);
    req.files = [];
    return res
      .status(400)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

const uploadProofFiles = (req, res, next) => {
  proofUpload.array("proof", 3)(req, res, async (err) => {
    if (err) {
      await cleanupUploadedFiles(req.files);
      req.files = [];
      return next(err);
    }

    next();
  });
};

router.use(protect, requireFieldWorker);

router.get("/assignments", getMyAssignments);
router.get("/stats", getFieldStats);

router.patch(
  "/assignments/:id/status",
  uploadProofFiles,
  fieldStatusUpdateValidator,
  validate,
  updateAssignmentStatus,
);

export default router;
