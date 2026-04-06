import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/slug/:slug", getCategoryBySlug); // 🔥 important
router.get("/:id", getCategoryById);

router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;