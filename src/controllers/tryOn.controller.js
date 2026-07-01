import mongoose from "mongoose";
import TryOnHistory from "../models/tryOnHistory.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createTryOnPreview = asyncHandler(async (req, res) => {
  const { productId, productImage } = req.body;
  const userImage = req.file?.path || req.body.userImage;

  if (!productImage) {
    throw new ApiError(400, "Product image is required");
  }

  if (!userImage) {
    throw new ApiError(400, "User image is required");
  }


  const generatedPreviewUrl = userImage;

  let history = null;
  if (req.user) {
    history = await TryOnHistory.create({
      user: req.user._id,
      product: mongoose.isValidObjectId(productId) ? productId : undefined,
      userImage,
      productImage,
      generatedImage: generatedPreviewUrl,
    });
  }

  new ApiResponse(res, 201, "Try-on preview generated", {
    generatedPreviewUrl,
    history,
  }).send();
});

export const getMyTryOnHistory = asyncHandler(async (req, res) => {
  const history = await TryOnHistory.find({ user: req.user._id })
    .populate("product")
    .sort({ createdAt: -1 });

  new ApiResponse(res, 200, "Try-on history fetched", history).send();
});

export const deleteTryOnHistory = asyncHandler(async (req, res) => {
  const history = await TryOnHistory.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!history) throw new ApiError(404, "Try-on history not found");

  await history.deleteOne();
  new ApiResponse(res, 200, "Try-on history deleted").send();
});
