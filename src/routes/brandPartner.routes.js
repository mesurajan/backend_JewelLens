import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createBrandPartner,
  getBrandPartners,
  updateBrandPartner,
  deleteBrandPartner,
} from "../controllers/brandPartner.controller.js";

const router = express.Router();

router.get("/", getBrandPartners);
router.post("/", protect, adminOnly, createBrandPartner);
router.put("/:id", protect, adminOnly, updateBrandPartner);
router.delete("/:id", protect, adminOnly, deleteBrandPartner);

export default router;
