import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;