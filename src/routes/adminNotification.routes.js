import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { getAdminNotifications } from "../controllers/adminNotification.controller.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAdminNotifications);

export default router;
