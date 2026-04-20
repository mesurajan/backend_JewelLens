import express from "express";
import { optionalProtect, protect } from "../middleware/auth.middleware.js";
import { deleteReview, getReviewsByProduct, upsertReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/:productId", optionalProtect, getReviewsByProduct);
router.post("/", protect, upsertReview);
router.delete("/:id", protect, deleteReview);

export default router;
