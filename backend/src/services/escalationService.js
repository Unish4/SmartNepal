import Issue from "../models/Issue.js";
import User from "../models/User.js";
import logger from "../config/logger.js";
import { sendEscalationEmail } from "../utils/emailService.js";

const findResponsibleAdmins = async (issue) => {
  const { province, district } = issue.location || {};

  const scopedAdmins = await User.find({
    role: "admin",
    "jurisdiction.province": province,
    $or: [
      { "jurisdiction.district": district },
      { "jurisdiction.district": { $exists: false } },
      { "jurisdiction.district": null },
    ],
  })
    .select("name email")
    .lean();

  const superAdmins = await User.find({ role: "super_admin" })
    .select("name email")
    .lean();

  return [...scopedAdmins, ...superAdmins];
};

export const runEscalationCheck = async () => {
  const now = new Date();

  // Find overdue issues that are not escalated and are not currently processing
  const overdueIssues = await Issue.find({
    slaDeadline: { $lt: now },
    status: { $nin: ["resolved", "rejected"] },
    escalated: false,
    escalationState: { $ne: "processing" },
  });

  let escalatedCount = 0;

  for (const issue of overdueIssues) {
    try {
      // 1. Atomically claim only if the issue is still un-escalated.
      const claimedIssue = await Issue.findOneAndUpdate(
        { _id: issue._id, escalated: false },
        { $set: { escalationState: "processing" } },
        { returnDocument: "after" },
      );

      if (!claimedIssue) {
        continue;
      }

      // 2. Resolve target recipients (responsible admins)
      let admins;
      try {
        admins = await findResponsibleAdmins(claimedIssue);
      } catch (resolveErr) {
        await Issue.findByIdAndUpdate(claimedIssue._id, {
          escalationState: "failed",
          $push: {
            escalationErrors: {
              adminEmail: "N/A",
              error: `Recipient resolution failed: ${resolveErr.message || String(resolveErr)}`,
              occurredAt: new Date(),
            },
          },
        });
        continue;
      }

      // 3. Send escalation emails to all intended recipients
      const deliveryErrors = [];
      await Promise.all(
        admins.map((admin) =>
          sendEscalationEmail(admin, claimedIssue).catch((err) => {
            deliveryErrors.push({
              adminEmail: admin.email,
              error: err.message || String(err),
              occurredAt: new Date(),
            });
            logger.error(
              { err, adminEmail: admin.email, issueId: claimedIssue._id },
              "Escalation email failed",
            );
          })
        )
      );

      // 4. Verify delivery success: require success for ALL intended recipients
      if (deliveryErrors.length === 0) {
        await Issue.findByIdAndUpdate(claimedIssue._id, {
          escalated: true,
          escalatedAt: now,
          escalationState: "completed",
          escalationErrors: [], // Clear any previous errors
        });
        escalatedCount++;
      } else {
        // Persist delivery failures so future sweeps can retry them
        await Issue.findByIdAndUpdate(claimedIssue._id, {
          escalationState: "failed",
          $push: { escalationErrors: { $each: deliveryErrors } },
        });
      }
    } catch (err) {
      logger.error({ err, issueId: issue._id }, "Failed to process escalation check");
      try {
        await Issue.findByIdAndUpdate(issue._id, {
          escalationState: "failed",
          $push: {
            escalationErrors: {
              adminEmail: "Unknown",
              error: `Internal sweep failure: ${err.message || String(err)}`,
              occurredAt: new Date(),
            },
          },
        });
      } catch (saveErr) {
        logger.error({ err: saveErr, issueId: issue._id }, "Failed to recover escalationState to failed");
      }
    }
  }

  if (escalatedCount > 0) {
    logger.info(
      { escalatedCount, checked: overdueIssues.length },
      "Escalation sweep completed",
    );
  }

  return { checked: overdueIssues.length, escalated: escalatedCount };
};
