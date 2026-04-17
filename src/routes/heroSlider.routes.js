import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createHeroSlider,
  getHeroSliders,
  updateHeroSlider,
  deleteHeroSlider,
} from "../controllers/heroSlider.controller.js";

const router = express.Router();

router.get("/", getHeroSliders);
router.post("/", protect, adminOnly, createHeroSlider);
router.put("/:id", protect, adminOnly, updateHeroSlider);
router.delete("/:id", protect, adminOnly, deleteHeroSlider);

export default router;
