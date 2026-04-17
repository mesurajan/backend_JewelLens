import InstagramPost from "../models/instagramPost.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { instagramPostSchema } from "../validations/instagramPost.validation.js";

export const createInstagramPost = asyncHandler(async (req, res) => {
  const validation = instagramPostSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Instagram post validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid instagram post data");
  }

  const post = await InstagramPost.create(validation.data);
  new ApiResponse(res, 201, "Instagram post created", post).send();
});

export const getInstagramPosts = asyncHandler(async (req, res) => {
  const posts = await InstagramPost.find().sort({ createdAt: -1 });
  new ApiResponse(res, 200, "Instagram posts fetched", posts).send();
});

export const updateInstagramPost = asyncHandler(async (req, res) => {
  const post = await InstagramPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Instagram post not found");

  const validation = instagramPostSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Instagram post validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid instagram post data");
  }

  Object.assign(post, validation.data);
  await post.save();

  new ApiResponse(res, 200, "Instagram post updated", post).send();
});

export const deleteInstagramPost = asyncHandler(async (req, res) => {
  const post = await InstagramPost.findById(req.params.id);
  if (!post) throw new ApiError(404, "Instagram post not found");

  await post.deleteOne();
  new ApiResponse(res, 200, "Instagram post deleted").send();
});
