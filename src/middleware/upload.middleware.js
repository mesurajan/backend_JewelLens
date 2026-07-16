import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";

const createImageUploader = (folder, transformation) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      ...(transformation ? { transformation } : {}),
    }),
  });

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
};

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "JewelLens/avatar",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 600, crop: "fill", gravity: "face" }],
  }),
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new ApiError(400, "Please upload a valid image file"));
  }

  cb(null, true);
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadProductImages = createImageUploader("JewelLens/products");
export const uploadTryOnImage = createImageUploader("JewelLens/tryon/user-uploads");
export const uploadHeroSliderImage = createImageUploader("JewelLens/hero-sliders", [
  { width: 1920, height: 900, crop: "limit", quality: "auto", fetch_format: "auto" },
]);
export const uploadAboutImages = createImageUploader("JewelLens/about", [
  { width: 1920, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" },
]);
