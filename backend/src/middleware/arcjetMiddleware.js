export const arcjetGuard =
  (client, context = () => ({})) =>
  async (req, res, next) => {
    if (!client) return next();

    try {
      const decision = await client.protect(req, {
        requested: 1,
        ...context(req),
      });

      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            success: false,
            message:
              "Too many requests. Please slow down and try again shortly.",
          });
        }
        if (decision.reason.isBot()) {
          return res.status(403).json({
            success: false,
            message: "Automated access is not permitted on this endpoint.",
          });
        }
        if (decision.reason.isEmail()) {
          return res.status(400).json({
            success: false,
            message:
              "Please use a valid, non-disposable email address to register.",
          });
        }
        if (decision.reason.isShield()) {
          return res.status(403).json({
            success: false,
            message: "Your request was blocked for security reasons.",
          });
        }
        // Fallback for any future Arcjet rule type not explicitly handled.
        return res
          .status(403)
          .json({ success: false, message: "Request denied." });
      }

      next();
    } catch (error) {
      console.error(`Arcjet check failed, failing open: ${error.message}`);
      next();
    }
  };

export const shieldGuard = (client) => async (req, res, next) => {
  if (!client) return next();
  try {
    const decision = await client.protect(req, { requested: 1 });
    if (decision.isDenied() && decision.reason.isShield()) {
      return res.status(403).json({
        success: false,
        message: "Your request was blocked for security reasons.",
      });
    }
    next();
  } catch (error) {
    console.error(`Arcjet shield check failed, failing open: ${error.message}`);
    next();
  }
};
