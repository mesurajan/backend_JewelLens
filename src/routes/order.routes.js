import express from "express";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  deleteMyDeliveredOrder,
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminOrderStats,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/me", protect, getMyOrders);
router.get("/me/:id", protect, getMyOrderById);
router.patch("/me/:id/cancel", protect, cancelMyOrder);
router.delete("/me/:id", protect, deleteMyDeliveredOrder);

router.get("/admin/stats", protect, adminOnly, getAdminOrderStats);
router.get("/admin/list", protect, adminOnly, getAdminOrders);
router.get("/admin/:id", protect, adminOnly, getAdminOrderById);
router.put("/admin/:id", protect, adminOnly, updateAdminOrder);
router.delete("/admin/:id", protect, adminOnly, deleteAdminOrder);

export default router;
