import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["published", "pending", "rejected"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
