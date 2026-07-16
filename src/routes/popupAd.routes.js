import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createPopupAd,
  deletePopupAd,
  getActivePopupAd,
  getPopupAds,
  updatePopupAd,
} from "../controllers/popupAd.controller.js";

const router = express.Router();

router.get("/active", getActivePopupAd);
router.get("/", protect, adminOnly, getPopupAds);
router.post("/", protect, adminOnly, createPopupAd);
router.put("/:id", protect, adminOnly, updatePopupAd);
router.delete("/:id", protect, adminOnly, deletePopupAd);

export default router;
