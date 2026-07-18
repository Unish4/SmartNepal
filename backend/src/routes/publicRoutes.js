import { Router } from "express";
import {
  getPublicScorecard,
  getScorecardDirectory,
} from "../controllers/scorecardController.js";
import {
  getPublicIssues,
  getPublicIssueById,
  getPublicCategoriesList,
  getPublicPlatformStats,
} from "../controllers/publicApiController.js";
import { scorecardArcjet, publicApiArcjet } from "../config/arcjet.js";
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

const v1Router = Router();

v1Router.get("/issues", arcjetGuard(publicApiArcjet), getPublicIssues);

v1Router.get("/issues/:id", arcjetGuard(publicApiArcjet), getPublicIssueById);

v1Router.get(
  "/categories",
  arcjetGuard(publicApiArcjet),
  getPublicCategoriesList,
);

v1Router.get("/stats", arcjetGuard(publicApiArcjet), getPublicPlatformStats);

router.use("/v1", v1Router);

export default router;
