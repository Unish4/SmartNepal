import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_API_KEY",
  "TOTP_ENCRYPTION_KEY",
];
REQUIRED_ENV_VARS.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable not set: ${varName}`);
  }
});

// Validate TOTP_ENCRYPTION_KEY format: exactly 64 hexadecimal characters
const totpKey = process.env.TOTP_ENCRYPTION_KEY;
if (!/^[0-9a-fA-F]{64}$/.test(totpKey)) {
  throw new Error(
    `TOTP_ENCRYPTION_KEY must be exactly 64 hexadecimal characters, received: ${totpKey.length} characters`
  );
}

const ENV = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  GMAIL_USER: process.env.GMAIL_USER,
  ARCJET_KEY: process.env.ARCJET_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  TOTP_ENCRYPTION_KEY: process.env.TOTP_ENCRYPTION_KEY,
  ATLAS_SEARCH_ENABLED: process.env.ATLAS_SEARCH_ENABLED === "true",
  ATLAS_SEARCH_INDEX:
    process.env.ATLAS_SEARCH_INDEX && process.env.ATLAS_SEARCH_INDEX !== "null"
      ? process.env.ATLAS_SEARCH_INDEX
      : undefined,
};

if (ENV.ATLAS_SEARCH_ENABLED && !ENV.ATLAS_SEARCH_INDEX) {
  throw new Error(
    "ATLAS_SEARCH_INDEX must be configured when ATLAS_SEARCH_ENABLED is true.",
  );
}

export default ENV;
