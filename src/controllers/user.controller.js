import User from "../models/user.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs";

// Get all users (admin only)
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password"); // hide passwords
  new ApiResponse(res, 200, "Users retrieved successfully", users).send();
});

// Get single user by ID (admin or self)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  // Optionally allow user to see only self
  if (req.user.role !== "admin" && req.user.id !== user._id.toString())
    throw new ApiError(403, "Not authorized");

  new ApiResponse(res, 200, "User retrieved successfully", user).send();
});

// Get current authenticated user
export const getCurrentUser = asyncHandler(async (req, res) => {
  new ApiResponse(res, 200, "Current user retrieved successfully", req.user).send();
});

// Get current user's cart
export const getMyCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({ path: "cart.product", model: "Product" }).select("cart");
  if (!user) throw new ApiError(404, "User not found");
  new ApiResponse(res, 200, "Cart retrieved successfully", user.cart).send();
});

// Update current user's cart
export const updateMyCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart)) throw new ApiError(400, "Cart must be an array");

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  user.cart = cart.map((item) => ({
    product: item.product,
    quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
  }));

  await user.save();
  await user.populate({ path: "cart.product", model: "Product" });
  new ApiResponse(res, 200, "Cart updated successfully", user.cart).send();
});

// Get current user's wishlist
export const getMyWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({ path: "wishlist", model: "Product" }).select("wishlist");
  if (!user) throw new ApiError(404, "User not found");
  new ApiResponse(res, 200, "Wishlist retrieved successfully", user.wishlist).send();
});

// Update current user's wishlist
export const updateMyWishlist = asyncHandler(async (req, res) => {
  const { wishlist } = req.body;
  if (!Array.isArray(wishlist)) throw new ApiError(400, "Wishlist must be an array");

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  const uniqueWishlist = Array.from(new Set(wishlist.map((id) => id.toString())));
  user.wishlist = uniqueWishlist;

  await user.save();
  await user.populate({ path: "wishlist", model: "Product" });
  new ApiResponse(res, 200, "Wishlist updated successfully", user.wishlist).send();
});

// Update user (admin can update anyone; user can update self)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  // Authorization check
  if (req.user.role !== "admin" && req.user.id !== user._id.toString())
    throw new ApiError(403, "Not authorized");

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = await bcrypt.hash(password, 10);

  await user.save();

  new ApiResponse(res, 200, "User updated successfully", user).send();
});

// Delete user (admin can delete anyone; user can delete self)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  // Authorization check
  if (req.user.role !== "admin" && req.user.id !== user._id.toString())
    throw new ApiError(403, "Not authorized");

  await user.deleteOne();

  new ApiResponse(res, 200, "User deleted successfully").send();
});