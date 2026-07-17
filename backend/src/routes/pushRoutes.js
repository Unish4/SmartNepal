import { Router } from "express";
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
} from "../controllers/pushController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/vapid-public-key", getVapidPublicKey);
router.post("/subscribe", protect, subscribe);
router.post("/unsubscribe", protect, unsubscribe);

export default router;
