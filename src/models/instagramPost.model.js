import mongoose from "mongoose";

const instagramPostSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      default: "",
    },
    likes: {
      type: Number,
      default: 0,
    },
    link: {
      type: String,
      required: true,
      trim: true,
      default: "#",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InstagramPost", instagramPostSchema);
