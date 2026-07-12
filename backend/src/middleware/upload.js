import multer from "multer";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();
const proofUploadDir = path.join(os.tmpdir(), "smartnepal-proof-uploads");

mkdirSync(proofUploadDir, { recursive: true });

const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofUploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    const err = new Error("Only JPEG, PNG and WebP images are allowed");
    err.statusCode = 400;
    cb(err);
  }
};
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per individual file
    files: 3, // max 3 files per request
  },
});

export const proofUpload = multer({
  storage: proofStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per individual file
    files: 3, // max 3 files per request
  },
});

export const cleanupUploadedFiles = async (files = []) => {
  await Promise.all(
    files
      .filter((file) => file?.path)
      .map(async (file) => {
        try {
          await unlink(file.path);
        } catch {
          // Ignore temp file cleanup errors.
        }
      }),
  );
};
