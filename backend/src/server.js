import "./config/instrument.js"; // MUST be first

import ENV from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";
import logger from "./config/logger.js";
import * as Sentry from "@sentry/node";
import { startEscalationCron } from "./jobs/escalationCron.js";

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
  Sentry.captureException(reason);
});

const startServer = async () => {
  try {
    await connectDB();
    startEscalationCron();
    app.listen(ENV.PORT, () => {
      console.log(
        `Server running at http://localhost:${ENV.PORT} [${ENV.NODE_ENV}] ${ENV.ARCJET_KEY ? "(Arcjet enabled)" : "(Arcjet disabled)"}`,
      );
      logger.info(
        `Server running on port ${ENV.PORT} [${ENV.NODE_ENV}] ${ENV.ARCJET_KEY ? "(Arcjet enabled)" : "(Arcjet disabled)"}`,
      );
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
