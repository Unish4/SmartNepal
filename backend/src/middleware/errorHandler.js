import ENV from "../config/env.js";

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, next) {
  // ── Multer file upload errors 
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Each image must be smaller than 5MB",
      LIMIT_FILE_COUNT: "Maximum 3 images allowed per report",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
    });
  }

  // ── JWT verification errors 
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Not authorized — token is invalid or expired",
    });
  }

  // ── Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `An account with that ${field} already exists`,
    });
  }

  // ── Mongoose validation errors 
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  // ── Mongoose CastError (bad ObjectId format) ──────────────────────────
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── Default handler 
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    stack: ENV.NODE_ENV === "production" ? undefined : err.stack,
  });
}
