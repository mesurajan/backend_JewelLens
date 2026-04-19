import express from "express";
import {
  getUsers,
  getUserById,
  getCurrentUser,
  getMyCart,
  updateMyCart,
  getMyWishlist,
  updateMyWishlist,
  updateCurrentUser,
  uploadMyAvatar,
  changeMyPassword,
  deleteMyAccount,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

const router = express.Router();

// Current user routes
router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateCurrentUser);
router.put("/me/password", protect, changeMyPassword);
router.delete("/me", protect, deleteMyAccount);
router.get("/me/cart", protect, getMyCart);
router.put("/me/cart", protect, updateMyCart);
router.get("/me/wishlist", protect, getMyWishlist);
router.put("/me/wishlist", protect, updateMyWishlist);
router.post("/upload-avatar", protect, uploadAvatar.single("avatar"), uploadMyAvatar);

// Admin routes
router.get("/", protect, adminOnly, getUsers); // GET all users
router.get("/:id", protect, getUserById); // GET user by ID
router.put("/:id", protect, updateUser); // Update user
router.delete("/:id", protect, deleteUser); // Delete user

export default router;
