const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");

    return {
      folder: isVideo
        ? "middleman/properties/videos"
        : "middleman/properties/images",

      resource_type: isVideo ? "video" : "image",

      allowed_formats: isVideo
        ? ["mp4", "webm"]
        : ["jpg", "jpeg", "png", "webp"],

      transformation: isVideo
        ? undefined
        : [{ width: 1200, crop: "limit" }],
    };
  },
});

const propertyUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (video-safe)
  },
});

module.exports = propertyUpload;
