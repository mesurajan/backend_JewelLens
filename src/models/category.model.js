import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // 🔥 force lowercase
    },
    slug: {
      type: String,
      unique: true,
    },
    icon: {
      type: String,
      default: "📦",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

//  Auto slug before save
categorySchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

// 🔥 Prevent duplicate names (case-insensitive)
categorySchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);