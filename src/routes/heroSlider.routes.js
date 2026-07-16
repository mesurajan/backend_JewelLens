import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadHeroSliderImage } from "../middleware/upload.middleware.js";
import {
  createHeroSlider,
  getHeroSliders,
  getAdminHeroSliders,
  updateHeroSlider,
  deleteHeroSlider,
} from "../controllers/heroSlider.controller.js";

const router = express.Router();

router.get("/", getHeroSliders);
router.get("/admin", protect, adminOnly, getAdminHeroSliders);
router.post("/", protect, adminOnly, uploadHeroSliderImage.single("imageFile"), createHeroSlider);
router.put("/:id", protect, adminOnly, uploadHeroSliderImage.single("imageFile"), updateHeroSlider);
router.delete("/:id", protect, adminOnly, deleteHeroSlider);

export default router;
