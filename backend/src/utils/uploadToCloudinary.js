import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (
  buffer,
  folder = "NepalSewa",
  transformation = [
    { width: 1200, crop: "limit" },
    { quality: "auto:good" },
    { fetch_format: "auto" },
  ],
  publicId = null,
) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: "image",
      transformation,
    };
    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result); // result.secure_url is what we save in MongoDB
      },
    );
    // Write the in-memory buffer into the stream to trigger the upload.
    stream.end(buffer);
  });
};

export const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split("/image/upload/");
  if (parts.length < 2) return null;
  const path = parts[1];
  // Remove version prefix (e.g., v17839958/) if present
  const withoutVersion = path.replace(/^v\d+\//, "");
  // Remove extension (e.g., .jpg, .png)
  const publicId = withoutVersion.split(".").slice(0, -1).join(".");
  return publicId;
};

export const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    return result;
  } catch (err) {
    console.error(`Failed to delete image from Cloudinary: ${publicId}`, err);
    return null;
  }
};
