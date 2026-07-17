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

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeProductPayload = (body, files = []) => {
  const uploadedImages = files.map((file) => file.path).filter(Boolean);
  const existingImages = parseJsonField(body.images, Array.isArray(body.images) ? body.images : []);
  const images = [...existingImages, ...uploadedImages].filter(Boolean);
  const stockCount = parseNumberField(body.stockCount);

  return {
    ...body,
    price: parseNumberField(body.price),
    originalPrice: parseNumberField(body.originalPrice),
    stockCount,
    rating: parseNumberField(body.rating),
    reviews: parseNumberField(body.reviews),
    estimatedDeliveryDays: parseNumberField(body.estimatedDeliveryDays),
    inStock: stockCount === undefined ? parseBooleanField(body.inStock) : stockCount > 0,
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
  const wantsPagination = ["page", "limit", "search", "category"].some(
    (key) => req.query[key] !== undefined,
  );

  if (!wantsPagination) {
    const products = await Product.find().populate("category").sort({ createdAt: -1 });
    return new ApiResponse(res, 200, "Products fetched", products).send();
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const search = String(req.query.search || "").trim();
  const category = String(req.query.category || "").trim();
  const query = {};

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    query.$or = [{ name: pattern }, { description: pattern }, { material: pattern }];
  }

  if (category && category !== "all") {
    const categoryDocument = mongoose.isValidObjectId(category)
      ? await Category.findById(category).select("_id")
      : await Category.findOne({ name: new RegExp(`^${escapeRegExp(category)}$`, "i") }).select("_id");
    query.category = categoryDocument?._id ?? null;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  new ApiResponse(res, 200, "Products fetched", {
    items: products,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }).send();
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
