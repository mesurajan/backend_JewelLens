import mongoose from "mongoose";
import slugify from "slugify";

const variantOptionSchema = new mongoose.Schema({
  value: String,
  priceAdjustment: { type: Number, default: 0 },
});

const variantSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["size", "chain_length", "gemstone", "metal"],
  },
  label: String,
  options: [variantOptionSchema],
});

const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    slug: {
      type: String,
      unique: true,
    },

    description: String,

    // CATEGORY (REFERENCE)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // PRICING
    price: { type: Number, required: true },
    originalPrice: Number,

    //  STOCK
    stockCount: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },

    //  BASIC DETAILS
    material: String,
    weight: String,

    // 🖼 IMAGES
    images: [String],

    // RATING
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // VARIANTS
    variants: [variantSchema],

    //  SPECIFICATIONS
    specifications: {
      type: Map,
      of: String,
    },

    //  CARE
    careInstructions: [String],

    // CERTIFICATIONS
    certifications: [String],

    //  FAQ
    faqs: [faqSchema],

    //  CONTENT
    craftsmanshipStory: String,

    warranty: String,
    returnPolicy: String,

    //  SHIPPING
    estimatedDeliveryDays: { type: Number, default: 5 },
    freeShipping: { type: Boolean, default: false },
    codAvailable: { type: Boolean, default: false },
    emiAvailable: { type: Boolean, default: false },

    // OFFER
    offerBadge: String,
    offerEndsAt: Date,

    // FLAGS
    featured: { type: Boolean, default: false },

    //  RELATIONS
    frequentlyBoughtTogether: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    completeLook: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],

    // AI TRY-ON
    tryOnModelUrl: String, //  for virtual try-on (image/model)
  },
  { timestamps: true }
);

// AUTO SLUG
productSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

export default mongoose.model("Product", productSchema);