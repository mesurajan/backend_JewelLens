import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getRelatedProducts
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", protect, adminOnly, createProduct);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.get("/related/:slug", getRelatedProducts);

export default router;
