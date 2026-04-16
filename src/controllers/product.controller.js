// src/controllers/product.controller.js
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import slugify from "slugify";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { productSchema } from "../validations/product.validation.js";

// ---------------------------
// CREATE PRODUCT
// ---------------------------
export const createProduct = asyncHandler(async (req, res) => {
  console.log("REQ.BODY:", JSON.stringify(req.body, null, 2));

  // Validate using safeParse
  const validation = productSchema.safeParse(req.body);
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
// GET PRODUCT BY SLUG
// ---------------------------
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
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
  const validation = productSchema.safeParse(req.body);
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