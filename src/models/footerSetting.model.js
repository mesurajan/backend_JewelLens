import mongoose from "mongoose";

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const footerSettingSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, trim: true, default: "JewelLens" },
    description: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    copyrightText: { type: String, trim: true, default: "" },
    shopLinks: { type: [footerLinkSchema], default: [] },
    companyLinks: { type: [footerLinkSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("FooterSetting", footerSettingSchema);
