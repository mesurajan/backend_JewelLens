import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const resolveProduct = async (productIdentifier) => {
  const normalized = String(productIdentifier || "").trim();
  if (!normalized) {
    throw new ApiError(400, "Product is required");
  }

  const query = mongoose.Types.ObjectId.isValid(normalized)
    ? { $or: [{ _id: normalized }, { slug: normalized }] }
    : { slug: normalized };

  const product = await Product.findOne(query);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

const serializeReview = (review, currentUserId) => {
  const userId = review.userId?._id?.toString?.() ?? review.userId?.toString?.() ?? "";

  return {
    id: review._id.toString(),
    productId: review.productId?._id?.toString?.() ?? review.productId?.toString?.() ?? "",
    userId,
    userName: review.userId?.name || "Customer",
    rating: review.rating,
    title: review.title || "",
    comment: review.comment,
    status: review.status || "published",
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    verified: false,
    isOwner: Boolean(currentUserId) && currentUserId === userId,
  };
};

const serializeAdminReview = (review) => ({
  id: review._id.toString(),
  productId: review.productId?._id?.toString?.() ?? review.productId?.toString?.() ?? "",
  productName: review.productId?.name || "Unknown Product",
  customerName: review.userId?.name || "Customer",
  customerEmail: review.userId?.email || "",
  rating: review.rating,
  title: review.title || String(review.comment || "").trim().slice(0, 60) || "Review",
  comment: review.comment,
  status: review.status || "published",
  date: review.createdAt,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

const getPublishedReviewFilter = () => ({
  $or: [{ status: "published" }, { status: { $exists: false } }, { status: null }],
});

const recalculateProductReviewStats = async (productId) => {
  const [stats] = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        ...getPublishedReviewFilter(),
      },
    },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Number(stats.avgRating.toFixed(1)) : 0,
    reviews: stats?.reviewCount ?? 0,
  });

  return {
    avgRating: stats ? Number(stats.avgRating.toFixed(1)) : 0,
    totalReviews: stats?.reviewCount ?? 0,
  };
};

export const getReviewsByProduct = asyncHandler(async (req, res) => {
  const product = await resolveProduct(req.params.productId);

  const reviewQuery = { productId: product._id };
  if (req.user?.role !== "admin") {
    Object.assign(reviewQuery, getPublishedReviewFilter());
  }

  const reviews = await Review.find(reviewQuery)
    .populate("userId", "name")
    .sort({ createdAt: -1 });

  const currentUserId = req.user?._id?.toString?.() ?? req.user?.id ?? "";

  const currentUserReview = currentUserId
    ? await Review.findOne({ productId: product._id, userId: currentUserId }).populate("userId", "name")
    : null;

  const avgRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
      : 0;

  new ApiResponse(res, 200, "Reviews fetched successfully", {
    productId: product._id.toString(),
    avgRating,
    totalReviews: reviews.length,
    currentUserReview: currentUserReview ? serializeReview(currentUserReview, currentUserId) : null,
    reviews: reviews.map((review) => serializeReview(review, currentUserId)),
  }).send();
});

export const upsertReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment, title } = req.body;
  const product = await resolveProduct(productId);

  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const normalizedComment = String(comment || "").trim();
  if (!normalizedComment) {
    throw new ApiError(400, "Comment is required");
  }

  const normalizedTitle = String(title || "").trim();

  const review = await Review.findOneAndUpdate(
    { productId: product._id, userId: req.user._id },
    {
      $set: {
        rating: parsedRating,
        title: normalizedTitle,
        comment: normalizedComment,
        status: "published",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  ).populate("userId", "name");

  const stats = await recalculateProductReviewStats(product._id);

  new ApiResponse(res, 200, "Review saved successfully", {
    review: serializeReview(review, req.user._id.toString()),
    avgRating: stats.avgRating,
    totalReviews: stats.totalReviews,
  }).send();
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const isOwner = review.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  const productId = review.productId.toString();
  await review.deleteOne();
  const stats = await recalculateProductReviewStats(productId);

  new ApiResponse(res, 200, "Review deleted successfully", stats).send();
});

export const getAdminReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find({})
    .populate("productId", "name")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  new ApiResponse(res, 200, "Admin reviews fetched successfully", {
    reviews: reviews.map(serializeAdminReview),
  }).send();
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["published", "pending", "rejected"].includes(String(status))) {
    throw new ApiError(400, "Invalid review status");
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  )
    .populate("productId", "name")
    .populate("userId", "name email");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const stats = await recalculateProductReviewStats(review.productId._id || review.productId);

  new ApiResponse(res, 200, "Review status updated successfully", {
    review: serializeAdminReview(review),
    avgRating: stats.avgRating,
    totalReviews: stats.totalReviews,
  }).send();
});
