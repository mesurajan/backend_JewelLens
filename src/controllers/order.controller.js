import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const ALLOWED_ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"];
const ALLOWED_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const USER_CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;

const generateOrderNumber = () => {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${stamp}-${random}`;
};

const normalizeShippingAddress = (payload = {}) => ({
  fullName: String(payload.fullName || "").trim(),
  email: String(payload.email || "").trim().toLowerCase(),
  phone: String(payload.phone || "").trim(),
  province: String(payload.province || "").trim(),
  district: String(payload.district || "").trim(),
  city: String(payload.city || "").trim(),
  wardNo: String(payload.wardNo || "").trim(),
  streetAddress: String(payload.streetAddress || "").trim(),
  houseNo: String(payload.houseNo || "").trim(),
  landmark: String(payload.landmark || "").trim(),
});

const normalizeSelectedVariants = (selectedVariants = []) => {
  if (!Array.isArray(selectedVariants)) {
    return [];
  }

  return selectedVariants
    .map((variant) => ({
      type: String(variant?.type || "").trim(),
      value: String(variant?.value || "").trim(),
    }))
    .filter((variant) => variant.type && variant.value);
};

const resolveSelectedVariants = (product, selectedVariants = []) => {
  const productVariants = Array.isArray(product.variants) ? product.variants : [];
  const normalizedSelections = normalizeSelectedVariants(selectedVariants);

  return normalizedSelections.map((selection) => {
    const variant = productVariants.find((item) => item.type === selection.type);
    if (!variant) {
      throw new ApiError(400, `Invalid variant type selected for ${product.name}`);
    }

    const option = Array.isArray(variant.options)
      ? variant.options.find((item) => item.value === selection.value)
      : null;

    if (!option) {
      throw new ApiError(400, `Invalid ${variant.label || selection.type} selected for ${product.name}`);
    }

    return {
      type: variant.type,
      label: variant.label || variant.type,
      value: option.value,
      priceAdjustment: Number(option.priceAdjustment || 0),
    };
  });
};

const validateShippingAddress = (shippingAddress) => {
  const requiredFields = [
    ["fullName", "Full name"],
    ["phone", "Phone number"],
    ["province", "Province"],
    ["district", "District"],
    ["city", "City / municipality"],
    ["wardNo", "Ward no."],
    ["streetAddress", "Street address / tole"],
  ];

  for (const [field, label] of requiredFields) {
    if (!shippingAddress[field]) {
      throw new ApiError(400, `${label} is required`);
    }
  }
};

const serializeOrder = (orderDoc) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  const createdAt = new Date(order.createdAt);
  const cancelWindowExpiresAt = new Date(createdAt.getTime() + USER_CANCELLATION_WINDOW_MS);
  const canUserCancel = order.orderStatus === "processing" && cancelWindowExpiresAt.getTime() > Date.now();

  return {
    id: order._id?.toString?.() ?? order.id,
    orderNumber: order.orderNumber,
    user: order.user && typeof order.user === "object"
      ? {
          id: order.user._id?.toString?.() ?? order.user.id,
          name: order.user.name,
          email: order.user.email,
        }
      : undefined,
    items: (order.items || []).map((item) => ({
      productId: item.product?.toString?.() ?? item.product,
      name: item.productName,
      slug: item.productSlug,
      image: item.productImage,
      selectedVariants: item.selectedVariants || [],
      quantity: item.quantity,
      price: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: order.shippingAddress,
    pricing: order.pricing,
    subtotal: order.pricing?.subtotal ?? 0,
    tax: order.pricing?.tax ?? 0,
    shippingFee: order.pricing?.shippingFee ?? 0,
    total: order.pricing?.total ?? 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.orderStatus,
    deliveryOption: order.deliveryOption,
    deliveryInstructions: order.deliveryInstructions || "",
    statusHistory: order.statusHistory || [],
    notes: order.notes || "",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    canUserCancel,
    cancelWindowExpiresAt: cancelWindowExpiresAt.toISOString(),
  };
};

const restoreOrderStock = async (order) => {
  const updates = order.items.map(async (item) => {
    const product = await Product.findById(item.product);
    if (!product) return;
    product.stockCount += item.quantity;
    product.inStock = product.stockCount > 0;
    await product.save();
  });

  await Promise.all(updates);
};

export const createOrder = asyncHandler(async (req, res) => {
  const {
    items = [],
    paymentMethod = "cod",
    shippingAddress: rawShippingAddress = {},
    deliveryOption = "standard",
    deliveryInstructions = "",
    notes = "",
  } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one item is required to place an order");
  }

  if (paymentMethod !== "cod") {
    throw new ApiError(400, "This payment method is coming soon. Please use Cash on Delivery for now.");
  }

  if (!["standard", "express"].includes(deliveryOption)) {
    throw new ApiError(400, "Invalid delivery option selected");
  }

  const shippingAddress = normalizeShippingAddress(rawShippingAddress);
  validateShippingAddress(shippingAddress);

  const normalizedItems = items.map((item) => {
    const productId = String(item?.productId || item?.product || "").trim();
    const quantity = Number(item?.quantity);
    const selectedVariants = normalizeSelectedVariants(item?.selectedVariants);

    if (!productId) {
      throw new ApiError(400, "Each order item must include a product");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ApiError(400, "Each order item must have a valid quantity");
    }

    return { productId, quantity, selectedVariants };
  });

  const uniqueProductIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: uniqueProductIds } });

  if (products.length !== uniqueProductIds.length) {
    throw new ApiError(404, "One or more products could not be found");
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const orderItems = [];
  let subtotal = 0;

  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new ApiError(404, "One or more products could not be found");
    }

    if (!product.inStock || product.stockCount < item.quantity) {
      throw new ApiError(400, `${product.name} does not have enough stock available`);
    }

    const resolvedSelectedVariants = resolveSelectedVariants(product, item.selectedVariants);
    const variantAdjustment = resolvedSelectedVariants.reduce(
      (sum, selection) => sum + selection.priceAdjustment,
      0
    );
    const unitPrice = product.price + variantAdjustment;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productSlug: product.slug || "",
      productImage: product.images?.[0] || "",
      selectedVariants: resolvedSelectedVariants,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const tax = Math.round(subtotal * 0.08);
  const shippingFee = deliveryOption === "express" ? 250 : 0;
  const total = subtotal + tax + shippingFee;

  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);
    product.stockCount -= item.quantity;
    product.inStock = product.stockCount > 0;
    await product.save();
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: req.user.id,
    items: orderItems,
    shippingAddress,
    pricing: { subtotal, tax, shippingFee, total },
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "processing",
    deliveryOption,
    deliveryInstructions: String(deliveryInstructions || "").trim(),
    statusHistory: [
      {
        status: "processing",
        note: `Order placed with Cash on Delivery via ${deliveryOption} delivery`,
      },
    ],
    notes: String(notes || "").trim(),
  });

  await User.findByIdAndUpdate(req.user.id, {
    $pull: {
      cart: {
        product: { $in: uniqueProductIds },
      },
    },
  });

  new ApiResponse(res, 201, "Order placed successfully", serializeOrder(order)).send();
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  new ApiResponse(res, 200, "Orders retrieved successfully", orders.map(serializeOrder)).send();
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) throw new ApiError(404, "Order not found");
  new ApiResponse(res, 200, "Order retrieved successfully", serializeOrder(order)).send();
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.orderStatus !== "processing") {
    throw new ApiError(400, "Only processing orders can be cancelled by the user");
  }

  const createdAt = new Date(order.createdAt).getTime();
  const cancellationDeadline = createdAt + USER_CANCELLATION_WINDOW_MS;

  if (Date.now() > cancellationDeadline) {
    throw new ApiError(400, "Order cancellation is only available within 2 hours of placing the order");
  }

  order.orderStatus = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    note: "Cancelled by user within the 2-hour cancellation window",
    changedAt: new Date(),
  });

  await restoreOrderStock(order);
  await order.save();

  new ApiResponse(res, 200, "Order cancelled successfully", serializeOrder(order)).send();
});

export const deleteMyDeliveredOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) throw new ApiError(404, "Order not found");

  if (order.orderStatus !== "delivered") {
    throw new ApiError(400, "Only delivered orders can be removed from your history");
  }

  await order.deleteOne();
  new ApiResponse(res, 200, "Delivered order removed successfully").send();
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const { search = "", status = "all" } = req.query;

  const query = {};

  if (status !== "all" && ALLOWED_ORDER_STATUSES.includes(status)) {
    query.orderStatus = status;
  }

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  const filtered = orders.filter((order) => {
    if (!search) return true;
    const haystack = [
      order.orderNumber,
      order.user?.name,
      order.user?.email,
      order.shippingAddress?.fullName,
      order.shippingAddress?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(String(search).toLowerCase());
  });

  new ApiResponse(res, 200, "Admin orders retrieved successfully", filtered.map(serializeOrder)).send();
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");
  new ApiResponse(res, 200, "Order retrieved successfully", serializeOrder(order)).send();
});

export const updateAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) throw new ApiError(404, "Order not found");

  const previousStatus = order.orderStatus;
  const { orderStatus, paymentStatus, shippingAddress, notes, deliveryOption, deliveryInstructions } = req.body;

  if (orderStatus !== undefined) {
    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
      throw new ApiError(400, "Invalid order status");
    }
    order.orderStatus = orderStatus;
  }

  if (paymentStatus !== undefined) {
    if (!ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
      throw new ApiError(400, "Invalid payment status");
    }
    order.paymentStatus = paymentStatus;
  }

  if (shippingAddress && typeof shippingAddress === "object") {
    const nextShippingAddress = {
      ...order.shippingAddress.toObject(),
      ...normalizeShippingAddress(shippingAddress),
    };
    validateShippingAddress(nextShippingAddress);
    order.shippingAddress = nextShippingAddress;
  }

  if (typeof notes === "string") {
    order.notes = notes.trim();
  }

  if (typeof deliveryInstructions === "string") {
    order.deliveryInstructions = deliveryInstructions.trim();
  }

  if (deliveryOption !== undefined) {
    if (!["standard", "express"].includes(deliveryOption)) {
      throw new ApiError(400, "Invalid delivery option selected");
    }
    order.deliveryOption = deliveryOption;
    order.pricing.shippingFee = deliveryOption === "express" ? 250 : 0;
    order.pricing.total = order.pricing.subtotal + order.pricing.tax + order.pricing.shippingFee;
  }

  if (previousStatus !== order.orderStatus) {
    order.statusHistory.push({
      status: order.orderStatus,
      note: `Updated by admin to ${order.orderStatus}`,
      changedAt: new Date(),
    });
  }

  if (previousStatus !== "cancelled" && order.orderStatus === "cancelled") {
    await restoreOrderStock(order);
  }

  if (order.orderStatus === "delivered" && order.paymentMethod === "cod" && order.paymentStatus === "pending") {
    order.paymentStatus = "paid";
  }

  await order.save();
  new ApiResponse(res, 200, "Order updated successfully", serializeOrder(order)).send();
});

export const deleteAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.orderStatus !== "cancelled") {
    await restoreOrderStock(order);
  }

  await order.deleteOne();
  new ApiResponse(res, 200, "Order deleted successfully").send();
});

export const getAdminOrderStats = asyncHandler(async (req, res) => {
  const [orders, userCount, productCount] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
    User.countDocuments({ role: "user" }),
    Product.countDocuments(),
  ]);

  const allOrders = await Order.find();

  const totalRevenue = allOrders
    .filter((order) => order.orderStatus !== "cancelled")
    .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

  const statusCounts = {
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  const monthlyRevenueMap = new Map();

  for (const order of allOrders) {
    statusCounts[order.orderStatus] += 1;

    const monthKey = new Date(order.createdAt).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const nextRevenue = (monthlyRevenueMap.get(monthKey) || 0) + (order.orderStatus === "cancelled" ? 0 : order.pricing.total);
    monthlyRevenueMap.set(monthKey, nextRevenue);
  }

  const revenueData = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  const now = new Date();
  const hourFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
  const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

  const createBuckets = (count, getDate, getLabel) =>
    Array.from({ length: count }, (_, index) => {
      const date = getDate(index);
      return {
        key: date.toISOString(),
        label: getLabel(date),
        revenue: 0,
        orders: 0,
      };
    });

  const dayBuckets = createBuckets(
    24,
    (index) => new Date(now.getTime() - (23 - index) * 60 * 60 * 1000),
    (date) => hourFormatter.format(date),
  );
  const weekBuckets = createBuckets(
    7,
    (index) => new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000),
    (date) => dayFormatter.format(date),
  );
  const monthBuckets = createBuckets(
    30,
    (index) => new Date(now.getTime() - (29 - index) * 24 * 60 * 60 * 1000),
    (date) => monthDayFormatter.format(date),
  );
  const yearBuckets = createBuckets(
    12,
    (index) => new Date(now.getFullYear(), now.getMonth() - (11 - index), 1),
    (date) => monthFormatter.format(date),
  );

  const isSameHour = (left, right) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate() &&
    left.getHours() === right.getHours();

  const isSameDay = (left, right) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();

  const isSameMonth = (left, right) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth();

  for (const order of allOrders) {
    const createdAt = new Date(order.createdAt);
    const revenue = order.orderStatus === "cancelled" ? 0 : order.pricing.total;

    for (const bucket of dayBuckets) {
      if (isSameHour(createdAt, new Date(bucket.key))) {
        bucket.orders += 1;
        bucket.revenue += revenue;
        break;
      }
    }

    for (const bucket of weekBuckets) {
      if (isSameDay(createdAt, new Date(bucket.key))) {
        bucket.orders += 1;
        bucket.revenue += revenue;
        break;
      }
    }

    for (const bucket of monthBuckets) {
      if (isSameDay(createdAt, new Date(bucket.key))) {
        bucket.orders += 1;
        bucket.revenue += revenue;
        break;
      }
    }

    for (const bucket of yearBuckets) {
      if (isSameMonth(createdAt, new Date(bucket.key))) {
        bucket.orders += 1;
        bucket.revenue += revenue;
        break;
      }
    }
  }

  new ApiResponse(res, 200, "Order stats retrieved successfully", {
    totalRevenue,
    totalOrders: allOrders.length,
    totalCustomers: userCount,
    totalProducts: productCount,
    statusCounts,
    revenueData,
    revenueTimeframes: {
      day: dayBuckets,
      week: weekBuckets,
      month: monthBuckets,
      year: yearBuckets,
    },
    recentOrders: orders.map(serializeOrder),
  }).send();
});
