import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createOccasion,
  getOccasions,
  updateOccasion,
  deleteOccasion,
} from "../controllers/occasion.controller.js";

const router = express.Router();

router.get("/", getOccasions);
router.post("/", protect, adminOnly, createOccasion);
router.put("/:id", protect, adminOnly, updateOccasion);
router.delete("/:id", protect, adminOnly, deleteOccasion);

export default router;
