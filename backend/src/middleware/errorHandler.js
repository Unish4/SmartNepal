import ENV from "../config/env.js";

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(err, req, res, next) {
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Each image must be smaller than 10MB",
      LIMIT_FILE_COUNT: "Maximum 3 images allowed per report",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field name",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: ENV.NODE_ENV === "production" ? null : err.stack,
  });
}
