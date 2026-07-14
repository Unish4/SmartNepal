import ENV from "./config/env.js";
import connectDB from "./config/db.js";
import app from "./app.js";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(
        `Server running at http://localhost:${ENV.PORT} [${ENV.NODE_ENV}] ${ENV.ARCJET_KEY ? "(Arcjet enabled)" : "(Arcjet disabled)"}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();