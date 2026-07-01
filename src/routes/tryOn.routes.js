import express from "express";
import { optionalProtect, protect } from "../middleware/auth.middleware.js";
import { uploadTryOnImage } from "../middleware/upload.middleware.js";
import {
  createTryOnPreview,
  deleteTryOnHistory,
  getMyTryOnHistory,
} from "../controllers/tryOn.controller.js";

const router = express.Router();

router.post("/", optionalProtect, uploadTryOnImage.single("userImage"), createTryOnPreview);
router.get("/my-history", protect, getMyTryOnHistory);
router.delete("/:id", protect, deleteTryOnHistory);

export default router;
