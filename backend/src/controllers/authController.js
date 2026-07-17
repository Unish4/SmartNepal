import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { validationResult } from "express-validator";
import ENV from "../config/env.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/uploadToCloudinary.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/emailService.js";
import VerificationToken from "../models/VerificationToken.js";
import { generateRawToken, hashToken } from "../utils/tokenUtils.js";
import { awardBadgesIfEarned } from "../services/badgeService.js";
import { TWO_FACTOR_REQUIRED_ROLES } from "../utils/twoFactorConfig.js";
import {
  generateSecret,
  buildQrCodeDataUrl,
  verifyToken,
  generateBackupCodes,
  hashBackupCode,
  encryptSecret,
  decryptSecret,
} from "../services/twoFactorService.js";
import {
  generatePendingTwoFactorToken,
  verifyPendingTwoFactorToken,
} from "../utils/generateToken.js";

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  province: user.province,
  district: user.district,
  city: user.city,
  avatar: user.avatar,
  emailNotifications: user.emailNotifications,
  preferredLanguage: user.preferredLanguage,
  isEmailVerified: user.isEmailVerified,
  jurisdiction: user.jurisdiction,
  department: user.department,
  stats: user.stats,
  badges: user.badges,
  twoFactorEnabled: user.twoFactorEnabled,
});

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
    return false;
  }
  return true;
};

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;
const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000;

const setTokenCookie = (res, req, token, maxAge = 7 * 24 * 60 * 60 * 1000) => {
  const isLocalhost =
    req.headers.host?.includes("localhost") ||
    req.headers.host?.includes("127.0.0.1");
  const secure = ENV.NODE_ENV === "production" && !isLocalhost;
  
  res.cookie("token", token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge,
    path: "/",
  });
};

const clearTokenCookie = (res, req) => {
  const isLocalhost =
    req.headers.host?.includes("localhost") ||
    req.headers.host?.includes("127.0.0.1");
  const secure = ENV.NODE_ENV === "production" && !isLocalhost;
  res.cookie("token", "", {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: 0,
    path: "/",
  });
};

export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => error.msg),
      });
    }

    const { name, email, password, phone, province, district, city } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      province,
      district,
      city,
      tokenVersion: 0,
      emailNotifications: true,
      preferredLanguage: "en",
      isEmailVerified: false,
      stats: { reportsSubmitted: 0, reportsResolved: 0, commentsPosted: 0 },
    });
    const token = generateToken(user);

    const rawToken = generateRawToken();
    await VerificationToken.create({
      user: user._id,
      tokenHash: hashToken(rawToken),
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS),
    });

    sendVerificationEmail(user, rawToken).catch((err) =>
      console.error("Verification email failed to send on register", {
        err,
        id: user._id,
      }),
    );

    setTokenCookie(res, req, token);

    res.status(201).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => error.msg),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +twoFactorEnabled +twoFactorSecret");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }



    // Force 2FA check for admin/super_admin/field_worker roles
    const requiresTwoFactor = TWO_FACTOR_REQUIRED_ROLES.includes(user.role);
    const hasTwoFactorEnabled = user.twoFactorEnabled === true;
    


    if (requiresTwoFactor && hasTwoFactorEnabled) {
      const pendingToken = generatePendingTwoFactorToken(user._id, user.tokenVersion);
      return res
        .status(200)
        .json({ success: true, requiresTwoFactor: true, pendingToken });
    }


    const token = generateToken(user);

    setTokenCookie(res, req, token);

    res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  clearTokenCookie(res, req);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const updatePreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => error.msg),
      });
    }

    const { emailNotifications, preferredLanguage } = req.body;

    const updates = {};
    if (emailNotifications !== undefined)
      updates.emailNotifications = emailNotifications;
    if (preferredLanguage !== undefined)
      updates.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((error) => error.msg),
      });
    }

    const allowed = ["name", "phone", "province", "district", "city"];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]?.trim?.() ?? req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const currentUser = await User.findById(req.user._id);
    const oldAvatar = currentUser?.avatar;

    const result = await uploadToCloudinary(
      req.file.buffer,
      "NepalSewa/avatars",
      [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true },
    ).select("-password");

    if (oldAvatar) {
      deleteFromCloudinary(oldAvatar).catch((err) =>
        console.error("Failed to delete old avatar from Cloudinary", err),
      );
    }

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const rawToken = generateRawToken();
      // Clear any previous unused reset tokens first — a citizen who
      // requests three resets in a row should only have their most
      // recent link actually work.
      await VerificationToken.deleteMany({
        user: user._id,
        purpose: "password_reset",
      });
      await VerificationToken.create({
        user: user._id,
        tokenHash: hashToken(rawToken),
        purpose: "password_reset",
        expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
      });
      sendPasswordResetEmail(user, rawToken).catch((err) =>
        console.error("Password reset email failed", {
          err,
          email: user.email,
        }),
      );
    }

    res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { token } = req.params;
    const { password } = req.body;

    const tokenDoc = await VerificationToken.findOne({
      tokenHash: hashToken(token),
      purpose: "password_reset",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(tokenDoc.user, {
      password: hashedPassword,
      $inc: { tokenVersion: 1 },
    });

    // Delete immediately after use — a reset link is single-use only.
    // Without this, the same emailed link could reset the password
    // again at any point before its expiry, a real risk if the email
    // itself is ever intercepted or forwarded.
    await tokenDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const tokenDoc = await VerificationToken.findOne({
      tokenHash: hashToken(token),
      purpose: "email_verification",
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: "This verification link is invalid or has expired.",
      });
    }

    await User.findByIdAndUpdate(tokenDoc.user, { isEmailVerified: true });
    awardBadgesIfEarned(tokenDoc.user).catch((err) =>
      console.error(`Badge check failed: ${err.message}`),
    );
    await tokenDoc.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/resend-verification
export const resendVerification = async (req, res, next) => {
  try {
    if (req.user.isEmailVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Your email is already verified." });
    }

    await VerificationToken.deleteMany({
      user: req.user._id,
      purpose: "email_verification",
    });

    const rawToken = generateRawToken();
    await VerificationToken.create({
      user: req.user._id,
      tokenHash: hashToken(rawToken),
      purpose: "email_verification",
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS),
    });

    sendVerificationEmail(req.user, rawToken).catch((err) =>
      console.error("Resend verification email failed", {
        err,
        email: req.user.email,
      }),
    );

    res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/auth/2fa/status 
export const getTwoFactorStatus = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      enabled: req.user.twoFactorEnabled,
      required: TWO_FACTOR_REQUIRED_ROLES.includes(req.user.role),
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/2fa/setup 
export const setupTwoFactor = async (req, res, next) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "Two-factor authentication is already enabled",
      });
    }
    const secret = generateSecret();
    const qrCodeDataUrl = await buildQrCodeDataUrl(req.user.email, secret);
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorPendingSecret: encryptSecret(secret),
    });

    res
      .status(200)
      .json({ success: true, qrCodeDataUrl, manualEntryKey: secret });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/2fa/verify-setup 
export const verifySetupTwoFactor = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { code } = req.body;

    const user = await User.findById(req.user._id).select(
      "+twoFactorPendingSecret",
    );
    if (!user.twoFactorPendingSecret) {
      return res.status(400).json({
        success: false,
        message: "No two-factor setup in progress. Start setup again.",
      });
    }

    const secret = decryptSecret(user.twoFactorPendingSecret);
    if (!verifyToken(code, secret)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }

    const backupCodes = generateBackupCodes();
    user.twoFactorSecret = encryptSecret(secret);
    user.twoFactorPendingSecret = undefined;
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = backupCodes.map((c) => ({
      codeHash: hashBackupCode(c),
    }));
    await user.save();

    const token = generateToken(user, true);
    setTokenCookie(res, req, token);

    res.status(200).json({
      success: true,
      message: "Two-factor authentication enabled",
      backupCodes,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/2fa/disable 
export const disableTwoFactor = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { password, code } = req.body;

    const user = await User.findById(req.user._id).select(
      "+twoFactorSecret +twoFactorBackupCodes password",
    );
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    const secret = user.twoFactorSecret
      ? decryptSecret(user.twoFactorSecret)
      : null;
    const isValidTotp = secret && verifyToken(code, secret);
    const isValidBackup =
      !isValidTotp &&
      user.twoFactorBackupCodes.some(
        (bc) => !bc.usedAt && bc.codeHash === hashBackupCode(code),
      );

    if (!isValidTotp && !isValidBackup) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();

    const token = generateToken(user, false);
    setTokenCookie(res, req, token);

    res
      .status(200)
      .json({ success: true, message: "Two-factor authentication disabled" });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/2fa/login-verify
export const verifyTwoFactorLogin = async (req, res, next) => {
  try {
    if (!checkValidation(req, res)) return;
    const { pendingToken, code } = req.body;
    let payload;
    try {
      payload = await verifyPendingTwoFactorToken(pendingToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: "This login attempt has expired. Please sign in again.",
      });
    }

    const user = await User.findById(payload.userId).select(
      "+twoFactorSecret +twoFactorBackupCodes",
    );
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({
        success: false,
        message: "Two-factor authentication is not active on this account.",
      });
    }

    const secret = decryptSecret(user.twoFactorSecret);
    const isValidTotp = verifyToken(code, secret);

    let usedBackupCode = null;
    if (!isValidTotp) {
      const codeHash = hashBackupCode(code);
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          twoFactorBackupCodes: {
            $elemMatch: { codeHash, usedAt: null },
          },
        },
        {
          $set: { "twoFactorBackupCodes.$.usedAt": new Date() },
        },
        {
          new: true,
          select: "+twoFactorBackupCodes",
        },
      );

      if (!updatedUser) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid verification code." });
      }

      usedBackupCode = true;
      user.twoFactorBackupCodes = updatedUser.twoFactorBackupCodes;
    }

    const token = generateToken(user, true);
    setTokenCookie(res, req, token);

    const remaining = user.twoFactorBackupCodes.filter(
      (bc) => !bc.usedAt,
    ).length;


    res.status(200).json({
      success: true,
      user: formatUser(user),
      ...(usedBackupCode
        ? { usedBackupCode: true, backupCodesRemaining: remaining }
        : {}),
    });
  } catch (error) {
    next(error);
  }
};
