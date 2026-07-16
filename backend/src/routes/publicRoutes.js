import { Router } from "express";
import {
  getPublicScorecard,
  getScorecardDirectory,
} from "../controllers/scorecardController.js";
import { scorecardArcjet } from "../config/arcjet.js";
import { arcjetGuard } from "../middleware/arcjetMiddleware.js";

const router = Router();

router.get(
  "/scorecard-directory",
  arcjetGuard(scorecardArcjet),
  getScorecardDirectory,
);
router.get(
  "/scorecard/:province{/:district}",
  arcjetGuard(scorecardArcjet),
  getPublicScorecard,
);

export default router;
