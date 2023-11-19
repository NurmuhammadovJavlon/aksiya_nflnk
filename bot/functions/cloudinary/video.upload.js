const axios = require("axios");
const fs = require("fs");
const cloudinary = require("../../connection/cloudinary.connection");

const uploadVideo = async (link, name) => {
  try {
    // Download the video file
    const response = await axios({
      method: "get",
      url: link,
      responseType: "stream",
    });

    // Create a temporary file to store the video
    const tempFilePath = `./bot/temp/${name}.mp4`;
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    // Wait for the download to complete
    await new Promise((resolve) => {
      writer.on("finish", resolve);
    });

    const upload = await cloudinary.v2.uploader.upload(tempFilePath, {
      resource_type: "video",
    });

    // Cleanup: Delete the temporary file
    fs.unlinkSync(tempFilePath);

    return upload.secure_url;
  } catch (error) {
    console.log(error);
  }
};

module.exports = uploadVideo;
