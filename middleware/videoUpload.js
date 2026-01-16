const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "property_videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "webm"]
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});
