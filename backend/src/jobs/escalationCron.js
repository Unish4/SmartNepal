import cron from "node-cron";
import logger from "../config/logger.js";
import { runEscalationCheck } from "../services/escalationService.js";

export const startEscalationCron = () => {
  cron.schedule("0 * * * *", async () => {
    logger.info("Running scheduled SLA escalation sweep");
    try {
      const result = await runEscalationCheck();
      logger.info(result, "Escalation sweep result");
    } catch (err) {
      logger.error({ err }, "Escalation sweep failed");
    }
  });
  logger.info("✓ SLA escalation cron scheduled (hourly)");
};
