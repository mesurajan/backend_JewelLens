import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  getPublicFooterSetting,
  getAdminFooterSettings,
  createFooterSetting,
  updateFooterSetting,
  deleteFooterSetting,
} from "../controllers/footerSetting.controller.js";

const router = express.Router();

router.get("/", getPublicFooterSetting);
router.get("/admin", protect, adminOnly, getAdminFooterSettings);
router.post("/", protect, adminOnly, createFooterSetting);
router.put("/:id", protect, adminOnly, updateFooterSetting);
router.delete("/:id", protect, adminOnly, deleteFooterSetting);

export default router;
