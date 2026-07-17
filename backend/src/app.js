// ─── Config
import ENV from "./config/env.js";
import connectDB from "./config/db.js";
import arcjetClient from "./config/arcjet.js";

// ─── Core
import express from "express";

// ─── Security & Logging
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { shieldGuard } from "./middleware/arcjetMiddleware.js";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";
import logger from "./config/logger.js";

// ─── Routes
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import fieldWorkerRoutes from "./routes/fieldWorkerRoutes.js";
import publicRoutes from "./routes/publicRoutes.js"; 
import notificationRoutes from "./routes/notificationRoutes.js"; 
import pushRoutes from "./routes/pushRoutes.js"; 

// ─── Error Handlers
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Security headers — must be first middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // unsafe-inline is needed for Tailwind's inline styles and Vite HMR
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "*",
          // Cloudinary CDN — issue and avatar photos
          "https://res.cloudinary.com",
          "https://*.cloudinary.com",
          // OpenStreetMap tile subdomains (a/b/c)
          "https://*.tile.openstreetmap.org",
          "https://*.openstreetmap.org",
          // Unsplash placeholder images used in dev
          "https://images.unsplash.com",
          "https://*.unsplash.com",
        ],
        connectSrc: [
          "'self'",
          // Nominatim reverse geocoding called by LocationPicker
          "https://nominatim.openstreetmap.org",
          // Allow frontend origin (dev and prod)
          ENV.CLIENT_URL,
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        // Upgrade HTTP to HTTPS in production only
        ...(ENV.NODE_ENV === "production"
          ? { upgradeInsecureRequests: [] }
          : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// HTTP request logging
if (ENV.NODE_ENV === "production") {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
    }),
  );
} else {
  app.use(morgan("dev"));
}

// Allow cross-origin requests from the frontend (cookie-safe)
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  skip: () => ENV.NODE_ENV !== "production",
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: () => ENV.NODE_ENV !== "production",
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(shieldGuard(arcjetClient)); // Global Arcjet Shield guard

app.use(generalLimiter);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ─── Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/field", fieldWorkerRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/push", pushRoutes); 

Sentry.setupExpressErrorHandler(app); 

// ─── Error middleware — must be last
app.use(notFound);
app.use(errorHandler);

export default app;
