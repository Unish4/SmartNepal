// ─── Config
import ENV from "./config/env.js";
import connectDB from "./config/db.js";

// ─── Core
import express from "express";

// ─── Security & Logging
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

// ─── Routes
import authRoutes from "./routes/authRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

// ─── Error Handlers
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import cookieParser from "cookie-parser";

const app = express();

// Security headers — must be first middleware
app.use(helmet());

// HTTP request logging — dev only
if (ENV.NODE_ENV !== "production") app.use(morgan("dev"));

// Allow cross-origin requests from the frontend (cookie-safe)
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

// Parse incoming JSON request bodies
app.use(express.json());
app.use(cookieParser());

// ─── Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);

// ─── Error middleware — must be last
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => {
      console.log(
        `Server running at http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
