import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadAboutImages } from "../middleware/upload.middleware.js";
import { createAboutItem, deleteAboutItem, getAdminAboutPage, getPublicAboutPage, updateAboutItem, updateAboutSection } from "../controllers/aboutPage.controller.js";

const router = express.Router();
router.get("/", getPublicAboutPage);
router.get("/admin", protect, adminOnly, getAdminAboutPage);
router.put("/:section", protect, adminOnly, uploadAboutImages.fields([
  { name: "imageFile", maxCount: 1 }, { name: "ethicsImage", maxCount: 1 },
  { name: "promiseImage", maxCount: 1 }, { name: "backgroundImage", maxCount: 1 },
]), updateAboutSection);
router.post("/:collection", protect, adminOnly, createAboutItem);
router.put("/:collection/:itemId", protect, adminOnly, updateAboutItem);
router.delete("/:collection/:itemId", protect, adminOnly, deleteAboutItem);
export default router;
