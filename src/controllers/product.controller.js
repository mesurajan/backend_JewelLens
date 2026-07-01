// src/controllers/product.controller.js
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import slugify from "slugify";
import mongoose from "mongoose";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { productSchema } from "../validations/product.validation.js";

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseNumberField = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const parseBooleanField = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return value === "true" || value === "1";
};

const normalizeProductPayload = (body, files = []) => {
  const uploadedImages = files.map((file) => file.path).filter(Boolean);
  const existingImages = parseJsonField(body.images, Array.isArray(body.images) ? body.images : []);
  const images = [...existingImages, ...uploadedImages].filter(Boolean);

  return {
    ...body,
    price: parseNumberField(body.price),
    originalPrice: parseNumberField(body.originalPrice),
    stockCount: parseNumberField(body.stockCount),
    rating: parseNumberField(body.rating),
    reviews: parseNumberField(body.reviews),
    estimatedDeliveryDays: parseNumberField(body.estimatedDeliveryDays),
    inStock: parseBooleanField(body.inStock),
    featured: parseBooleanField(body.featured),
    freeShipping: parseBooleanField(body.freeShipping),
    codAvailable: parseBooleanField(body.codAvailable),
    emiAvailable: parseBooleanField(body.emiAvailable),
    images,
    variants: parseJsonField(body.variants, []),
    specifications: parseJsonField(body.specifications, {}),
    careInstructions: parseJsonField(body.careInstructions, []),
    certifications: parseJsonField(body.certifications, []),
    faqs: parseJsonField(body.faqs, []),
    completeLook: parseJsonField(body.completeLook, []),
    frequentlyBoughtTogether: parseJsonField(body.frequentlyBoughtTogether, []),
    offerEndsAt: body.offerEndsAt || undefined,
  };
};

// ---------------------------
// CREATE PRODUCT
// ---------------------------
export const createProduct = asyncHandler(async (req, res) => {
  // Validate using safeParse
  const payload = normalizeProductPayload(req.body, req.files || []);
  const validation = productSchema.safeParse(payload);
  if (!validation.success) {
    console.error("Product validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid product data");
  }
  const data = validation.data;

  // Slug
  const slug = slugify(data.name, { lower: true, strict: true });

  // Check if product exists
  const existing = await Product.findOne({ slug });
  if (existing) throw new ApiError(409, "Product already exists");

  // Validate category
  const category = await Category.findById(data.category);
  if (!category) throw new ApiError(404, "Category not found");

  // Create product
  const product = await Product.create({ ...data, slug });

  new ApiResponse(res, 201, "Product created", product).send();
});

// ---------------------------
// GET ALL PRODUCTS
// ---------------------------
export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("category")
    .sort({ createdAt: -1 });

  new ApiResponse(res, 200, "Products fetched", products).send();
});

// ---------------------------
// GET PRODUCT BY ID OR SLUG
// ---------------------------
export const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { slug: id };

  const product = await Product.findOne(query)
    .populate("category")
    .populate("frequentlyBoughtTogether")
    .populate("completeLook");

  if (!product) throw new ApiError(404, "Product not found");

  new ApiResponse(res, 200, "Product fetched", product).send();
});

// ---------------------------
// UPDATE PRODUCT
// ---------------------------
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  // Validate updated data
  const payload = normalizeProductPayload(req.body, req.files || []);
  const validation = productSchema.safeParse(payload);
  if (!validation.success) {
    console.error("Product validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid product data");
  }
  const data = validation.data;

  // Update slug if name changed
  if (data.name && data.name !== product.name) {
    const slug = slugify(data.name, { lower: true, strict: true });
    const existing = await Product.findOne({ slug });
    if (existing && existing._id.toString() !== product._id.toString())
      throw new ApiError(409, "Product with this name already exists");
    product.slug = slug;
  }

  Object.assign(product, data);
  await product.save();

  new ApiResponse(res, 200, "Product updated", product).send();
});

// ---------------------------
// DELETE PRODUCT
// ---------------------------
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  await product.deleteOne();
  new ApiResponse(res, 200, "Product deleted").send();
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const currentProduct = await Product.findOne({ slug });

  if (!currentProduct) {
    throw new ApiError(404, "Product not found");
  }

  const related = await Product.find({
    category: currentProduct.category,
    _id: { $ne: currentProduct._id },
  })
    .limit(4)
    .lean();

  new ApiResponse(res, 200, "Related products fetched", related).send();
});
