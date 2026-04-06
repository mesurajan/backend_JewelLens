import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../middleware/async.middleware.js";
import { categorySchema } from "../validations/category.validation.js";
import slugify from "slugify";

// CREATE
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, status } = categorySchema.parse(req.body);

  const slug = slugify(name, { lower: true, strict: true });

  // 🔥 check duplicate (case-insensitive via slug)
  const existing = await Category.findOne({ slug });
  if (existing) throw new ApiError(409, "Category already exists");

  const category = await Category.create({
    name,
    slug,
    icon,
    status,
  });

  new ApiResponse(res, 201, "Category created", category).send();
});

// GET ALL
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  new ApiResponse(res, 200, "Categories fetched", categories).send();
});

// GET SINGLE
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  new ApiResponse(res, 200, "Category fetched", category).send();
});

// 🔥 GET BY SLUG (VERY IMPORTANT FOR FRONTEND)
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) throw new ApiError(404, "Category not found");

  new ApiResponse(res, 200, "Category fetched", category).send();
});

// UPDATE
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const { name, icon, status } = req.body;

  if (name) {
    const slug = slugify(name, { lower: true, strict: true });

    const existing = await Category.findOne({ slug });
    if (existing && existing._id.toString() !== category._id.toString()) {
      throw new ApiError(409, "Category already exists");
    }

    category.name = name;
    category.slug = slug;
  }

  if (icon) category.icon = icon;
  if (status) category.status = status;

  await category.save();

  new ApiResponse(res, 200, "Category updated", category).send();
});

// DELETE
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  await category.deleteOne();

  new ApiResponse(res, 200, "Category deleted").send();
});