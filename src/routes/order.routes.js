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
import {
  checkMyEsewaPaymentStatus,
  handleEsewaFailureReturn,
  retryMyEsewaPayment,
  verifyEsewaPayment,
} from "../controllers/esewaPayment.controller.js";
import { esewaRateLimit } from "../middleware/esewaRateLimit.middleware.js";

const router = express.Router();

router.post("/", protect, esewaRateLimit({ max: 10, onlyEsewaOrders: true }), createOrder);
router.post("/payments/esewa/verify", protect, esewaRateLimit(), verifyEsewaPayment);
router.post("/payments/esewa/failure/:transactionUuid", protect, esewaRateLimit(), handleEsewaFailureReturn);
router.post("/me/:id/esewa/status", protect, esewaRateLimit(), checkMyEsewaPaymentStatus);
router.post("/me/:id/esewa/retry", protect, esewaRateLimit({ max: 10 }), retryMyEsewaPayment);
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
