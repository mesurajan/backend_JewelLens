import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true, trim: true },
    productSlug: { type: String, trim: true, default: "" },
    productImage: { type: String, default: "" },
    selectedVariants: {
      type: [
        new mongoose.Schema(
          {
            type: { type: String, trim: true, required: true },
            label: { type: String, trim: true, default: "" },
            value: { type: String, trim: true, required: true },
            priceAdjustment: { type: Number, required: true, min: 0, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    wardNo: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    houseNo: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      required: true,
    },
    note: { type: String, trim: true, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentAttemptSchema = new mongoose.Schema(
  {
    transactionUuid: { type: String, required: true, trim: true },
    expectedAmount: { type: String, required: true, trim: true },
    productCode: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["initiated", "pending", "completed", "failed", "canceled", "refunded", "verification_failed"],
      default: "initiated",
    },
    providerStatus: { type: String, trim: true, default: "PENDING" },
    transactionCode: { type: String, trim: true, default: "" },
    referenceId: { type: String, trim: true, default: "" },
    failureReason: { type: String, trim: true, default: "" },
    initiatedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["esewa"], default: "esewa" },
    transactionUuid: { type: String, trim: true, default: "" },
    expectedAmount: { type: String, trim: true, default: "" },
    productCode: { type: String, trim: true, default: "" },
    transactionCode: { type: String, trim: true, default: "" },
    referenceId: { type: String, trim: true, default: "" },
    providerStatus: { type: String, trim: true, default: "PENDING" },
    initiatedAt: { type: Date },
    verifiedAt: { type: Date },
    attempts: { type: [paymentAttemptSchema], default: [] },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    checkoutAttemptId: { type: String, trim: true, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    pricing: { type: pricingSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "esewa", "khalti"],
      default: "cod",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
    },
    paymentDetails: { type: paymentDetailsSchema, default: undefined },
    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
      required: true,
    },
    deliveryOption: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
      required: true,
    },
    deliveryInstructions: { type: String, trim: true, default: "" },
    statusHistory: { type: [statusHistorySchema], default: [] },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

orderSchema.index(
  { "paymentDetails.transactionUuid": 1 },
  { unique: true, sparse: true }
);
orderSchema.index(
  { "paymentDetails.attempts.transactionUuid": 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Order", orderSchema);
