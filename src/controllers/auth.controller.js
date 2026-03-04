import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import asyncHandler from "../middleware/async.middleware.js";


export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, terms } = req.body;

  if (!terms) throw new ApiError(400, "Accept terms & conditions");
  if (password !== confirmPassword)
    throw new ApiError(400, "Passwords do not match");

  const { name: validName, email: validEmail, password: validPassword } =
    registerSchema.parse({ name, email, password });

  const existingUser = await User.findOne({ email: validEmail });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const hashedPassword = await bcrypt.hash(validPassword, 10);

  const user = await User.create({
    name: validName,
    email: validEmail,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  new ApiResponse(res, 201, "Account created successfully", { user, token }).send();
});



//login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, remember } = req.body;

  const { email: validEmail, password: validPassword } =
    loginSchema.parse({ email, password });

  const user = await User.findOne({ email: validEmail });
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isMatch = await bcrypt.compare(validPassword, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: remember ? "30d" : "7d",
  });

  new ApiResponse(res, 200, "Login successful", { user, token, role: user.role }).send();
});

/**
 * Placeholder OAuth login
 * For frontend testing, can just return success
 */
export const oauthLogin = asyncHandler(async (req, res) => {
  // In real, integrate Google/Facebook SDK, create/find user, return token
  const { provider, email, name } = req.body;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password: "oauth_dummy" });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  new ApiResponse(res, 200, `Logged in via ${provider}`, { user, token }).send();
});