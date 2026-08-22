import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMedia = async (file) => {
  try {
    return await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary media deletion failed:", error);
    throw error;
  }
};

export const deleteVideoFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
  } catch (error) {
    console.error("Cloudinary video deletion failed:", error);
    throw error;
  }
};
