import mongoose from "mongoose";

const heroSliderSchema = new mongoose.Schema(
  {
    placement: {
      type: String,
      enum: ["homepage", "collections"],
      default: "homepage",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    imageAlt: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    eyebrow: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    link: {
      type: String,
      required: true,
      trim: true,
      default: "/collections",
    },
    primaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    primaryButtonLink: { type: String, trim: true, default: "" },
    secondaryButtonText: { type: String, trim: true, maxlength: 40, default: "" },
    secondaryButtonLink: { type: String, trim: true, default: "" },
    highlightOneTitle: { type: String, trim: true, maxlength: 60, default: "" },
    highlightOneSubtitle: { type: String, trim: true, maxlength: 100, default: "" },
    highlightOneIcon: {
      type: String,
      enum: ["Gem", "ShieldCheck", "Sparkles", "Award", "BadgeCheck", "Crown", ""],
      default: "Gem",
    },
    highlightTwoTitle: { type: String, trim: true, maxlength: 60, default: "" },
    highlightTwoSubtitle: { type: String, trim: true, maxlength: 100, default: "" },
    highlightTwoIcon: {
      type: String,
      enum: ["Gem", "ShieldCheck", "Sparkles", "Award", "BadgeCheck", "Crown", ""],
      default: "ShieldCheck",
    },
    textAlignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    overlayStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: 58,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    order: {
      type: Number,
      default: 1,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

heroSliderSchema.index({ placement: 1, status: 1, order: 1 });

export default mongoose.model("HeroSlider", heroSliderSchema);
