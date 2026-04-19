import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const shippingProfileSchema = new mongoose.Schema(
  {
    province: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    wardNo: { type: String, trim: true, default: "" },
    streetAddress: { type: String, trim: true, default: "" },
    houseNo: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },
    addresses: { type: [addressSchema], default: [] },
    shippingProfile: { type: shippingProfileSchema, default: () => ({}) },
    lastLogin: { type: Date },
    provider: { type: String, enum: ["local", "google", "facebook"], default: "local" },
    providerId: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);
export default mongoose.model("User", userSchema);
