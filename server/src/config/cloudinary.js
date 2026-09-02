import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "../shared/logger.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

/**
 * Upload an in-memory buffer directly to Cloudinary using streams.
 *
 * @param {Buffer} buffer - The file buffer from multer.memoryStorage()
 * @param {Object} options - Cloudinary upload options (e.g. folder, resource_type)
 * @returns {Promise<{ url: string, publicId: string, format: string, bytes: number, resourceType: string }>}
 */
export const uploadStreamToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || "auto",
      folder: options.folder || "eduflow",
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error(`Cloudinary upload failed: ${error.message || error}`);
        return reject(error);
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type,
      });
    });

    stream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by public ID.
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.warn(`Failed to delete asset from Cloudinary (${publicId}): ${error.message}`);
  }
};

export default cloudinary;
