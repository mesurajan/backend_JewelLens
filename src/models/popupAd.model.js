import mongoose from "mongoose";

const popupAdSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    eyebrow: { type: String, trim: true, default: "Exclusive offer" },
    headline: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    imageAlt: { type: String, trim: true, default: "" },
    ctaLabel: { type: String, required: true, trim: true, default: "Shop now" },
    ctaLink: { type: String, required: true, trim: true, default: "/collections" },
    highlights: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    displayDelaySeconds: { type: Number, min: 0, max: 60, default: 2 },
    frequency: {
      type: String,
      enum: ["always", "once_session", "once_day"],
      default: "once_session",
    },
    priority: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

popupAdSchema.index({ status: 1, priority: -1, startsAt: 1, endsAt: 1 });

export default mongoose.model("PopupAd", popupAdSchema);
