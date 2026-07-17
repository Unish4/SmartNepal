import PushSubscription from "../models/PushSubscription.js";
import ENV from "../config/env.js";

// ─── GET /api/push/vapid-public-key 
export const getVapidPublicKey = (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: ENV.VAPID_PUBLIC_KEY,
    configured: !!ENV.VAPID_PUBLIC_KEY,
  });
};

// ─── POST /api/push/subscribe 
export const subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(endpoint);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    if (parsedUrl.protocol !== "https:") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    if (parsedUrl.username || parsedUrl.password) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const allowedPatterns = [
      /^fcm\.googleapis\.com$/,
      /^android\.googleapis\.com$/,
      /^(?:.*\.)?push\.apple\.com$/,
      /^(?:.*\.)?notify\.windows\.com$/,
      /^updates\.push\.services\.mozilla\.com$/,
    ];

    const isAllowedHost = allowedPatterns.some((pattern) => pattern.test(hostname));
    if (!isAllowedHost) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipPattern.test(hostname)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    if (
      hostname === "localhost" ||
      hostname === "localhost.localdomain" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid push subscription payload" });
    }

    const existing = await PushSubscription.findOne({ endpoint });
    if (existing) {
      if (existing.user.toString() !== req.user._id.toString()) {
        return res
          .status(409)
          .json({ success: false, message: "Endpoint already registered by another user" });
      }
      existing.keys = keys;
      await existing.save();
    } else {
      await PushSubscription.create({
        user: req.user._id,
        endpoint,
        keys,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/push/unsubscribe 
export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res
        .status(400)
        .json({ success: false, message: "Endpoint is required" });
    }
    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
