import mongoose from "mongoose";

const tryOnHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    userImage: { type: String, required: true },
    productImage: { type: String, required: true },
    generatedImage: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("TryOnHistory", tryOnHistorySchema);
