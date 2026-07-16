import mongoose from "mongoose";

const footerLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const trustItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "ShieldCheck" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const footerSettingSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true, trim: true, default: "JewelLens" },
    logoUrl: { type: String, trim: true, default: "" },
    tagline: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    highlightText: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    addressLine1: { type: String, trim: true, default: "" },
    addressLine2: { type: String, trim: true, default: "" },
    copyrightText: { type: String, trim: true, default: "" },
    shopLinks: { type: [footerLinkSchema], default: [] },
    companyLinks: { type: [footerLinkSchema], default: [] },
    socialLinks: { type: [socialLinkSchema], default: [] },
    trustItems: { type: [trustItemSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("FooterSetting", footerSettingSchema);
