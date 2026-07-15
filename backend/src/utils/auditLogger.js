import AuditLog from "../models/AuditLog.js";
import logger from "../config/logger.js";

export const logAdminAction = async ({
  actor,
  action,
  targetType,
  targetId,
  jurisdiction,
  details,
}) => {
  await AuditLog.create({
    actor: actor._id,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    jurisdiction: jurisdiction || {},
    details: details || {},
  });
};
