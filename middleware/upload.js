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

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB (safe for video)
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image or video files are allowed"), false);
    }
  },
});

module.exports = upload;
