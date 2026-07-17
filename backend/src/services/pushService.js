import webpush from "web-push";
import ENV from "../config/env.js";
import PushSubscription from "../models/PushSubscription.js";
import logger from "../config/logger.js";

const isValidSubject = (subject) => {
  if (!subject || typeof subject !== "string") return false;
  return subject.startsWith("mailto:") || subject.startsWith("https:");
};

const isConfigured = !!(
  ENV.VAPID_PUBLIC_KEY &&
  ENV.VAPID_PRIVATE_KEY &&
  isValidSubject(ENV.VAPID_SUBJECT)
);

if (isConfigured) {
  webpush.setVapidDetails(
    ENV.VAPID_SUBJECT,
    ENV.VAPID_PUBLIC_KEY,
    ENV.VAPID_PRIVATE_KEY,
  );
}

export const sendPushToUser = async (userId, payload) => {
  if (!isConfigured) return;

  const subscriptions = await PushSubscription.find({ user: userId }).lean();
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
          { timeout: 10_000 },
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
        } else {
          logger.error({ err, userId }, "Push send failed");
        }
      }
    }),
  );
};
