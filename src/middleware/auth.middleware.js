import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "./async.middleware.js";
import User from "../models/user.model.js";

/**
 * Verify JWT
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, token missing");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id).select("-password");

  next();
});

/**
 * Admin only access
 */
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access only");
  }
  next();
};