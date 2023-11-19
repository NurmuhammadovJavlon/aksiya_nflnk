const cloudinary = require("../../connection/cloudinary.connection");
const fetch = require("node-fetch");

// Function to upload photo to Cloudinary
async function uploadPhotoToCloudinary(fileurl) {
  try {
    // Get photo file path from Telegram
    const fileUrl = fileurl;

    // Fetch the photo file
    // const response = await fetch(fileUrl);
    // const photoBuffer = await response.buffer();

    // Upload photo to Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(fileUrl, {
      resource_type: "image",
      folder: "telegram_photos",
    });

    return cloudinaryResponse;
  } catch (error) {
    console.error("Error uploading photo to Cloudinary:", error);
    throw error;
  }
}

module.exports = uploadPhotoToCloudinary;
