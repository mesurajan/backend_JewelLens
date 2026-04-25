import express from "express";
import { adminOnly, optionalProtect, protect } from "../middleware/auth.middleware.js";
import { deleteReview, getAdminReviews, getReviewsByProduct, updateReviewStatus, upsertReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/admin/all", protect, adminOnly, getAdminReviews);
router.patch("/admin/:id/status", protect, adminOnly, updateReviewStatus);
router.get("/:productId", optionalProtect, getReviewsByProduct);
router.post("/", protect, upsertReview);
router.delete("/:id", protect, deleteReview);

export default router;
