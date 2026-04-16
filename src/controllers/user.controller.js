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