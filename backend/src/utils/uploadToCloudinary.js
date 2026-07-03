import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (buffer, folder = "SmartNepal") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result); // result.secure_url is what we save in MongoDB
      }
    );
    // Write the in-memory buffer into the stream to trigger the upload.
    stream.end(buffer);
  });
};