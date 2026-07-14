import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  suggestCategorization,
  generateTitleController,
  checkDuplicates,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  aiSuggestValidator,
  aiTitleValidator,
  aiDuplicateValidator,
} from "../utils/validators.js";
import { validationResult } from "express-validator";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV !== "production",
  message: {
    success: false,
    message: "Too many AI requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Shared validation check middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post(
  "/suggest",
  protect,
  aiLimiter,
  aiSuggestValidator,
  validate,
  suggestCategorization,
);
router.post(
  "/generate-title",
  protect,
  aiLimiter,
  aiTitleValidator,
  validate,
  generateTitleController,
);
router.post(
  "/check-duplicates",
  protect,
  aiLimiter,
  aiDuplicateValidator,
  validate,
  checkDuplicates,
);

export default router;
