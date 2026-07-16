import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { serializeOrder } from "./order.controller.js";
import {
  buildEsewaPaymentRequest,
  checkEsewaTransactionStatus,
  createEsewaTransactionUuid,
  decodeAndVerifyEsewaResponse,
  formatEsewaAmount,
  getEsewaConfig,
} from "../services/esewa.service.js";

const terminalFailureStatuses = new Set(["CANCELED", "NOT_FOUND"]);
const refundStatuses = new Set(["FULL_REFUND", "PARTIAL_REFUND"]);

const getUserEsewaOrder = async (userId, query) => {
  const order = await Order.findOne({ user: userId, paymentMethod: "esewa", ...query });
  if (!order) throw new ApiError(404, "eSewa order not found");
  return order;
};

const getUserEsewaOrderByTransaction = (userId, transactionUuid) =>
  getUserEsewaOrder(userId, {
    $or: [
      { "paymentDetails.transactionUuid": transactionUuid },
      { "paymentDetails.attempts.transactionUuid": transactionUuid },
    ],
  });

const ensureAttemptHistory = (order) => {
  if (!order.paymentDetails) throw new ApiError(400, "eSewa payment details are missing");
  if (!Array.isArray(order.paymentDetails.attempts)) order.paymentDetails.attempts = [];
  if (!order.paymentDetails.attempts.length && order.paymentDetails.transactionUuid) {
    order.paymentDetails.attempts.push({
      transactionUuid: order.paymentDetails.transactionUuid,
      expectedAmount: order.paymentDetails.expectedAmount || formatEsewaAmount(order.pricing.total),
      productCode: order.paymentDetails.productCode || getEsewaConfig().productCode,
      status: order.paymentStatus === "paid" ? "completed" : "pending",
      providerStatus: order.paymentDetails.providerStatus || "PENDING",
      transactionCode: order.paymentDetails.transactionCode || "",
      referenceId: order.paymentDetails.referenceId || "",
      initiatedAt: order.paymentDetails.initiatedAt || order.createdAt,
      verifiedAt: order.paymentDetails.verifiedAt,
    });
  }
  return order.paymentDetails.attempts;
};

const findPaymentAttempt = (order, transactionUuid = order.paymentDetails?.transactionUuid) => {
  const attempt = ensureAttemptHistory(order).find((item) => item.transactionUuid === transactionUuid);
  if (!attempt) throw new ApiError(404, "eSewa payment attempt not found");
  return attempt;
};

const createCartItemKey = (productId, selectedVariants = []) => {
  const normalized = selectedVariants.map((item) => `${item.type}:${item.value}`).sort().join("|");
  return normalized ? `${productId}::${normalized}` : String(productId);
};

const clearPurchasedCartItems = async (order) => {
  const user = await User.findById(order.user).select("cart");
  if (!user) return;
  const purchasedKeys = new Set(
    order.items.map((item) => createCartItemKey(item.product.toString(), item.selectedVariants || []))
  );
  user.cart = user.cart.filter(
    (item) => !purchasedKeys.has(createCartItemKey(item.product.toString(), item.selectedVariants || []))
  );
  await user.save();
};

const mirrorCurrentAttempt = (order, attempt) => {
  order.paymentDetails.transactionUuid = attempt.transactionUuid;
  order.paymentDetails.expectedAmount = attempt.expectedAmount;
  order.paymentDetails.productCode = attempt.productCode;
  order.paymentDetails.providerStatus = attempt.providerStatus;
  order.paymentDetails.referenceId = attempt.referenceId || "";
  order.paymentDetails.transactionCode = attempt.transactionCode || "";
  order.paymentDetails.initiatedAt = attempt.initiatedAt;
  order.paymentDetails.verifiedAt = attempt.verifiedAt;
};

const applyEsewaStatus = async (order, attempt, statusPayload, callbackPayload = null) => {
  const providerStatus = String(statusPayload.status || "PENDING").toUpperCase();
  const wasPaid = order.paymentStatus === "paid";
  attempt.providerStatus = providerStatus;
  attempt.referenceId = String(statusPayload.ref_id || statusPayload.refId || attempt.referenceId || "");
  attempt.transactionCode = String(callbackPayload?.transaction_code || attempt.transactionCode || "");

  if (providerStatus === "COMPLETE") {
    attempt.status = "completed";
    attempt.verifiedAt = attempt.verifiedAt || new Date();
    order.paymentStatus = "paid";
    mirrorCurrentAttempt(order, attempt);
    if (!wasPaid) await clearPurchasedCartItems(order);
  } else if (refundStatuses.has(providerStatus)) {
    attempt.status = "refunded";
    attempt.verifiedAt = new Date();
    if (wasPaid || order.paymentDetails.transactionUuid === attempt.transactionUuid) order.paymentStatus = "refunded";
    mirrorCurrentAttempt(order, attempt);
  } else if (terminalFailureStatuses.has(providerStatus)) {
    attempt.status = providerStatus === "CANCELED" ? "canceled" : "failed";
    attempt.failureReason = `eSewa returned ${providerStatus}`;
    attempt.verifiedAt = new Date();
    if (order.paymentDetails.transactionUuid === attempt.transactionUuid) mirrorCurrentAttempt(order, attempt);
    // Keep the order unpaid and intact so this same order can receive a new payment attempt.
    if (!wasPaid) order.paymentStatus = "pending";
  } else {
    attempt.status = "pending";
    if (order.paymentDetails.transactionUuid === attempt.transactionUuid) mirrorCurrentAttempt(order, attempt);
  }

  await order.save();
  return order;
};

const verifyOrderWithEsewa = async (order, attempt, callbackPayload = null) => {
  try {
    const statusPayload = await checkEsewaTransactionStatus({
      transactionUuid: attempt.transactionUuid,
      totalAmount: attempt.expectedAmount,
      productCode: attempt.productCode,
    });
    return applyEsewaStatus(order, attempt, statusPayload, callbackPayload);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 400) {
      attempt.status = "verification_failed";
      attempt.failureReason = error.message;
      await order.save();
    }
    throw error;
  }
};

export const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const callbackPayload = decodeAndVerifyEsewaResponse(req.body?.data);
  const config = getEsewaConfig();
  const transactionUuid = String(callbackPayload.transaction_uuid || "");
  const order = await getUserEsewaOrderByTransaction(req.user.id, transactionUuid);
  const attempt = findPaymentAttempt(order, transactionUuid);

  if (String(callbackPayload.product_code || "") !== attempt.productCode || attempt.productCode !== config.productCode) {
    throw new ApiError(400, "eSewa product code did not match");
  }
  if (formatEsewaAmount(callbackPayload.total_amount) !== formatEsewaAmount(attempt.expectedAmount)) {
    throw new ApiError(400, "eSewa callback amount did not match the order");
  }
  if (String(callbackPayload.status || "").toUpperCase() !== "COMPLETE") {
    throw new ApiError(400, "eSewa did not report a completed payment");
  }

  if (order.paymentStatus === "paid" && attempt.status === "completed") {
    return new ApiResponse(res, 200, "eSewa payment was already verified", serializeOrder(order)).send();
  }

  const verifiedOrder = await verifyOrderWithEsewa(order, attempt, callbackPayload);
  if (verifiedOrder.paymentStatus !== "paid") {
    throw new ApiError(409, "eSewa payment is not complete yet. Please check again shortly.");
  }
  new ApiResponse(res, 200, "eSewa payment verified successfully", serializeOrder(verifiedOrder)).send();
});

export const checkMyEsewaPaymentStatus = asyncHandler(async (req, res) => {
  const order = await getUserEsewaOrder(req.user.id, { _id: req.params.id });
  const attempt = findPaymentAttempt(order);
  const verifiedOrder = await verifyOrderWithEsewa(order, attempt);
  new ApiResponse(res, 200, `eSewa payment status: ${attempt.providerStatus}`, serializeOrder(verifiedOrder)).send();
});

export const retryMyEsewaPayment = asyncHandler(async (req, res) => {
  const order = await getUserEsewaOrder(req.user.id, { _id: req.params.id });
  if (order.paymentStatus !== "pending" || order.orderStatus !== "processing" || !order.items.length || order.pricing.total <= 0) {
    throw new ApiError(400, "Only valid pending eSewa orders can be retried");
  }

  const attempts = ensureAttemptHistory(order);
  const previousAttempt = attempts.find((item) => item.transactionUuid === order.paymentDetails.transactionUuid);
  if (!previousAttempt) throw new ApiError(400, "Current eSewa payment attempt is missing");

  if (!terminalFailureStatuses.has(String(previousAttempt.providerStatus || "").toUpperCase())) {
    await verifyOrderWithEsewa(order, previousAttempt);
    if (order.paymentStatus === "paid") {
      throw new ApiError(409, "This eSewa payment is already complete");
    }
    if (!terminalFailureStatuses.has(String(previousAttempt.providerStatus || "").toUpperCase())) {
      throw new ApiError(409, "The current eSewa attempt is still pending and cannot be replaced yet");
    }
  }

  const config = getEsewaConfig();
  const nextAttempt = {
    transactionUuid: createEsewaTransactionUuid(),
    expectedAmount: formatEsewaAmount(order.pricing.total),
    productCode: config.productCode,
    status: "initiated",
    providerStatus: "PENDING",
    initiatedAt: new Date(),
  };
  attempts.push(nextAttempt);
  mirrorCurrentAttempt(order, attempts[attempts.length - 1]);
  await order.save();

  const responseData = serializeOrder(order);
  responseData.esewaPayment = buildEsewaPaymentRequest(order, attempts[attempts.length - 1]);
  new ApiResponse(res, 200, "Continue to eSewa to retry this payment", responseData).send();
});

export const handleEsewaFailureReturn = asyncHandler(async (req, res) => {
  const transactionUuid = String(req.params.transactionUuid || "");
  const order = await getUserEsewaOrderByTransaction(req.user.id, transactionUuid);
  const attempt = findPaymentAttempt(order, transactionUuid);
  const verifiedOrder = await verifyOrderWithEsewa(order, attempt);
  new ApiResponse(res, 200, `eSewa payment status: ${attempt.providerStatus}`, serializeOrder(verifiedOrder)).send();
});
