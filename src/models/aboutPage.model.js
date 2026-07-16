import mongoose from "mongoose";

const iconNames = ["Gem", "ShieldCheck", "Heart", "Globe2", "Award", "Users", "Leaf", "Truck", "PackageCheck", "Sparkles", "Target", "Eye"];
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  icon: { type: String, enum: iconNames, default: "Gem" },
  sortOrder: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const statisticSchema = new mongoose.Schema({
  value: { type: String, required: true, trim: true, maxlength: 30 },
  suffix: { type: String, trim: true, maxlength: 10, default: "" },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  icon: { type: String, enum: iconNames, default: "Gem" },
  sortOrder: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
const imageCardSchema = new mongoose.Schema({
  title: { type: String, trim: true, maxlength: 100, default: "" },
  paragraphs: { type: [String], default: [] },
  icon: { type: String, enum: iconNames, default: "Leaf" },
  imageUrl: { type: String, trim: true, default: "" },
  imagePublicId: { type: String, trim: true, default: "" },
  imageAlt: { type: String, trim: true, maxlength: 160, default: "" },
  imagePosition: { type: String, enum: ["center", "top", "bottom", "left", "right"], default: "center" },
}, { _id: false });

const aboutPageSchema = new mongoose.Schema({
  pageKey: { type: String, unique: true, default: "about", immutable: true },
  isPublished: { type: Boolean, default: true },
  contentVersion: { type: Number, min: 0, default: 0 },
  hero: {
    eyebrow: { type: String, trim: true, maxlength: 80, default: "" }, title: { type: String, trim: true, maxlength: 120, default: "" },
    description: { type: String, trim: true, maxlength: 600, default: "" }, primaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    primaryButtonLink: { type: String, trim: true, default: "" }, secondaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    secondaryButtonLink: { type: String, trim: true, default: "" }, imageUrl: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" }, imageAlt: { type: String, trim: true, maxlength: 160, default: "" },
    imagePosition: { type: String, enum: ["center", "top", "bottom", "left", "right"], default: "center" },
    overlayStrength: { type: Number, min: 0, max: 100, default: 55 }, isActive: { type: Boolean, default: true },
  },
  statistics: { type: [statisticSchema], default: [] },
  missionVision: {
    eyebrow: { type: String, trim: true, maxlength: 80, default: "" }, heading: { type: String, trim: true, maxlength: 120, default: "" },
    missionTitle: { type: String, trim: true, maxlength: 100, default: "" }, missionDescription: { type: String, trim: true, maxlength: 600, default: "" },
    missionIcon: { type: String, enum: iconNames, default: "Target" }, visionTitle: { type: String, trim: true, maxlength: 100, default: "" },
    visionDescription: { type: String, trim: true, maxlength: 600, default: "" }, visionIcon: { type: String, enum: iconNames, default: "Eye" },
    isActive: { type: Boolean, default: true },
  },
  coreValues: { type: [itemSchema], default: [] },
  benefits: { type: [itemSchema], default: [] },
  ethicsPromise: {
    eyebrow: { type: String, trim: true, maxlength: 80, default: "" }, heading: { type: String, trim: true, maxlength: 120, default: "" },
    ethics: { type: imageCardSchema, default: () => ({ icon: "Leaf" }) }, promise: { type: imageCardSchema, default: () => ({ icon: "Award" }) },
    isActive: { type: Boolean, default: true },
  },
  callToAction: {
    eyebrow: { type: String, trim: true, maxlength: 80, default: "" }, title: { type: String, trim: true, maxlength: 120, default: "" },
    description: { type: String, trim: true, maxlength: 400, default: "" }, primaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    primaryButtonLink: { type: String, trim: true, default: "" }, secondaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    secondaryButtonLink: { type: String, trim: true, default: "" }, backgroundImageUrl: { type: String, trim: true, default: "" },
    backgroundImagePublicId: { type: String, trim: true, default: "" }, isActive: { type: Boolean, default: true },
  },
}, { timestamps: true });

export { iconNames as aboutIconNames };
export default mongoose.model("AboutPage", aboutPageSchema);
