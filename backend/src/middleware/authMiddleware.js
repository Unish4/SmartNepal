import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ENV from "../config/env.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
    }

    // Verify token version to invalidate stale sessions (e.g. after password reset)
    if (
      decoded.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, session expired",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin" && req.user?.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized — admin access required",
    });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "super_admin") {
    return res
      .status(403)
      .json({
        success: false,
        message: "Not authorized — super admin access required",
      });
  }
  next();
};

export const requireFieldWorker = (req, res, next) => {
  if (req.user?.role !== "field_worker") {
    return res.status(403).json({
      success: false,
      message: "Not authorized — field worker access required",
    });
  }
  next();
};
