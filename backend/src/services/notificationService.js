import Notification from "../models/Notification.js";
import logger from "../config/logger.js";
import { sendPushToUser } from "./pushService.js";

export const notify = async ({ recipient, type, title, message, link }) => {
  if (!recipient) return;
  try {
    await Notification.create({ recipient, type, title, message, link });
  } catch (err) {
    logger.error(
      { err, recipient, type },
      "Failed to create in-app notification",
    );
  }
  sendPushToUser(recipient, { title, body: message, link }).catch((err) =>
    logger.error({ err, recipient }, "Push notification failed"),
  );
};

// ── Small builder helpers

export const notifyStatusChange = (recipientId, issue, newStatus) => {
  const STATUS_MESSAGES = {
    verified: `Your report "${issue.title}" has been verified.`,
    "in-progress": `Work has started on your report "${issue.title}".`,
    resolved: `Your report "${issue.title}" has been resolved.`,
    rejected: `Your report "${issue.title}" could not be actioned.`,
  };
  const message = STATUS_MESSAGES[newStatus];
  if (!message) return Promise.resolve(); // "open" and any future statuses stay silent

  return notify({
    recipient: recipientId,
    type: "status_change",
    title: "Report status updated",
    message,
    link: `/issues/${issue._id}`,
  });
};

export const notifyAssignment = (fieldWorkerId, issue) =>
  notify({
    recipient: fieldWorkerId,
    type: "assignment",
    title: "New assignment",
    message: `You've been assigned: "${issue.title}"`,
    link: `/field/assignments/${issue._id}`,
  });

export const notifyEscalation = (adminId, issue) =>
  notify({
    recipient: adminId,
    type: "escalation",
    title: "SLA breached",
    message: `"${issue.title}" has passed its SLA deadline and needs attention.`,
    link: `/admin/issues`,
  });
