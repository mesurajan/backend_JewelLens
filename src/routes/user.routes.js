import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin routes
router.get("/", protect, adminOnly, getUsers); // GET all users
router.get("/:id", protect, getUserById); // GET user by ID
router.put("/:id", protect, updateUser); // Update user
router.delete("/:id", protect, deleteUser); // Delete user

export default router;