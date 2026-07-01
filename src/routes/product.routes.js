import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { uploadProductImages } from "../middleware/upload.middleware.js";

import {
  createProduct,
  getProducts,
  getProductByIdOrSlug,
  updateProduct,
  deleteProduct,
  getRelatedProducts
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", protect, adminOnly, uploadProductImages.array("images", 8), createProduct);
router.get("/", getProducts);
router.get("/related/:slug", getRelatedProducts);
router.get("/:id", getProductByIdOrSlug);
router.put("/:id", protect, adminOnly, uploadProductImages.array("images", 8), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
