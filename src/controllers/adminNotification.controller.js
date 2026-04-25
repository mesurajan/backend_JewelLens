import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiResponse from "../utils/ApiResponse.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parseLimit = (value) => {
  const limit = Number.parseInt(String(value ?? DEFAULT_LIMIT), 10);

  if (!Number.isFinite(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
};

const parseSince = (value) => {
  if (!value) return null;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const serializeOrderNotification = (order) => ({
  id: `order:${order._id.toString()}`,
  type: "new_order",
  entityId: order._id.toString(),
  entityType: "order",
  createdAt: order.createdAt,
  title: "New order received",
  message: `${order.shippingAddress?.fullName || order.user?.name || "A customer"} placed ${order.orderNumber}`,
  href: "/admin/orders",
  meta: {
    orderNumber: order.orderNumber,
    customerName: order.user?.name || order.shippingAddress?.fullName || "Customer",
    customerEmail: order.user?.email || order.shippingAddress?.email || "",
    total: order.pricing?.total || 0,
    status: order.orderStatus,
  },
});

const serializeUserNotification = (user) => ({
  id: `user:${user._id.toString()}`,
  type: "new_user",
  entityId: user._id.toString(),
  entityType: "user",
  createdAt: user.createdAt,
  title: "New user registered",
  message: `${user.name || "A customer"} created an account`,
  href: "/admin/customers",
  meta: {
    userName: user.name || "Customer",
    email: user.email || "",
    role: user.role || "user",
  },
});

const serializeReviewNotification = (review) => ({
  id: `review:${review._id.toString()}`,
  type: "new_review",
  entityId: review._id.toString(),
  entityType: "review",
  createdAt: review.createdAt,
  title: "New review submitted",
  message: `${review.userId?.name || "A customer"} reviewed ${review.productId?.name || "a product"}`,
  href: "/admin/reviews",
  meta: {
    productName: review.productId?.name || "Product",
    customerName: review.userId?.name || "Customer",
    customerEmail: review.userId?.email || "",
    rating: review.rating,
    status: review.status || "published",
  },
});

export const getAdminNotifications = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit);
  const since = parseSince(req.query.since);

  const [orders, users, reviews] = await Promise.all([
    Order.find(since ? { createdAt: { $gt: since } } : {})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit),
    User.find({
      role: "user",
      ...(since ? { createdAt: { $gt: since } } : {}),
    })
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(limit),
    Review.find(since ? { createdAt: { $gt: since } } : {})
      .populate("productId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit),
  ]);

  const notifications = [...orders.map(serializeOrderNotification), ...users.map(serializeUserNotification), ...reviews.map(serializeReviewNotification)]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);

  const unreadSummary = notifications.reduce(
    (summary, notification) => {
      if (notification.type === "new_order") {
        summary.orders += 1;
      } else if (notification.type === "new_user") {
        summary.users += 1;
      } else if (notification.type === "new_review") {
        summary.reviews += 1;
      }

      return summary;
    },
    { orders: 0, users: 0, reviews: 0 }
  );

  new ApiResponse(res, 200, "Admin notifications retrieved successfully", {
    notifications,
    unreadSummary,
    latestCreatedAt: notifications[0]?.createdAt ?? null,
  }).send();
});
