import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createInstagramPost,
  getInstagramPosts,
  updateInstagramPost,
  deleteInstagramPost,
} from "../controllers/instagramPost.controller.js";

const router = express.Router();

router.get("/", getInstagramPosts);
router.post("/", protect, adminOnly, createInstagramPost);
router.put("/:id", protect, adminOnly, updateInstagramPost);
router.delete("/:id", protect, adminOnly, deleteInstagramPost);

export default router;
