import multer from "multer";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const storage = multer.memoryStorage();

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
