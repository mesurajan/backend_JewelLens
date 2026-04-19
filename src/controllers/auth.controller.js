import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import asyncHandler from "../middleware/async.middleware.js";

const createToken = (user, expiresIn = "7d") =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn,
  });

const getGoogleUser = async (idToken) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, "Google OAuth is not configured");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new ApiError(401, "Invalid Google token");
  }

  const data = await response.json();

  if (data.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(401, "Google token audience mismatch");
  }

  if (!data.email) {
    throw new ApiError(401, "Google account email is required");
  }

  return {
    email: data.email,
    name: data.name || data.email.split("@")[0],
    providerId: data.sub,
  };
};

const getFacebookUser = async (accessToken) => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new ApiError(500, "Facebook OAuth is not configured");
  }

  const debugResponse = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(
      `${appId}|${appSecret}`
    )}`
  );

  if (!debugResponse.ok) {
    throw new ApiError(401, "Invalid Facebook token");
  }

  const debugData = await debugResponse.json();

  if (!debugData.data?.is_valid || debugData.data.app_id !== appId) {
    throw new ApiError(401, "Invalid Facebook token");
  }

  const userResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );

  if (!userResponse.ok) {
    throw new ApiError(401, "Unable to fetch Facebook profile");
  }

  const userData = await userResponse.json();

  if (!userData.email) {
    throw new ApiError(401, "Facebook account email is required");
  }

  return {
    email: userData.email,
    name: userData.name || userData.id,
    providerId: userData.id,
  };
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, terms, phone = "", address = "" } = req.body;

  if (!terms) throw new ApiError(400, "Accept terms & conditions");
  if (password !== confirmPassword)
    throw new ApiError(400, "Passwords do not match");

  const { name: validName, email: validEmail, password: validPassword, phone: validPhone, address: validAddress } =
    registerSchema.parse({ name, email, password, phone, address });

  const existingUser = await User.findOne({ email: validEmail });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const hashedPassword = await bcrypt.hash(validPassword, 10);

  const user = await User.create({
    name: validName,
    email: validEmail,
    password: hashedPassword,
    phone: validPhone,
    address: validAddress,
    addresses: validAddress
      ? [
          {
            label: "Primary",
            address: validAddress,
            isDefault: true,
          },
        ]
      : [],
  });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
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

  user.lastLogin = new Date();
  await user.save();

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
  const { provider, token } = req.body;

  if (!provider || !token) {
    throw new ApiError(400, "OAuth provider and token are required");
  }

  let profile;

  if (provider === "google") {
    profile = await getGoogleUser(token);
  } else if (provider === "facebook") {
    profile = await getFacebookUser(token);
  } else {
    throw new ApiError(400, "Unsupported OAuth provider");
  }

  const { email, name, providerId } = profile;

  let user = await User.findOne({ email });

  if (!user) {
    const password = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
    user = await User.create({
      name,
      email,
      password,
      provider,
      providerId,
      lastLogin: new Date(),
    });
  } else {
    if (user.provider === "local") {
      user.provider = provider;
      user.providerId = providerId;
    }

    user.lastLogin = new Date();
    await user.save();
  }

  const authToken = createToken(user, "7d");
  new ApiResponse(res, 200, `Logged in via ${provider}`, { user, token: authToken }).send();
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone = "" } = req.body;

  const { name: validName, email: validEmail, password: validPassword, phone: validPhone } =
    registerSchema.parse({ name, email, password, phone });

  const existingUser = await User.findOne({ email: validEmail });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const hashedPassword = await bcrypt.hash(validPassword, 10);

  const admin = await User.create({
    name: validName,
    email: validEmail,
    password: hashedPassword,
    phone: validPhone,
    role: "admin", // force admin
  });

  new ApiResponse(res, 201, "Admin created successfully", admin).send();
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  if (admin.role !== "admin") throw new ApiError(400, "Not an admin");

  await admin.deleteOne();
  new ApiResponse(res, 200, "Admin deleted successfully").send();
});

// UPDATE Admin by ID
export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  if (admin.role !== "admin") throw new ApiError(400, "Not an admin");

  const { name, email, password } = req.body;
  if (name) admin.name = name;
  if (email) admin.email = email;
  if (password) admin.password = await bcrypt.hash(password, 10);

  await admin.save();
  new ApiResponse(res, 200, "Admin updated successfully", admin).send();
});
