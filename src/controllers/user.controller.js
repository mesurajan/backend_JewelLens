import User from "../models/user.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs";

const sanitizeAddresses = (addresses = [], fallbackAddress = "") => {
  if (!Array.isArray(addresses)) {
    return fallbackAddress
      ? [
          {
            label: "Primary",
            address: fallbackAddress.trim(),
            isDefault: true,
          },
        ]
      : [];
  }

  const cleaned = addresses
    .map((item, index) => ({
      label: String(item?.label || `Address ${index + 1}`).trim(),
      address: String(item?.address || "").trim(),
      isDefault: Boolean(item?.isDefault),
    }))
    .filter((item) => item.label && item.address);

  if (!cleaned.length && fallbackAddress.trim()) {
    return [
      {
        label: "Primary",
        address: fallbackAddress.trim(),
        isDefault: true,
      },
    ];
  }

  if (cleaned.length) {
    const defaultIndex = cleaned.findIndex((item) => item.isDefault);
    cleaned.forEach((item, index) => {
      item.isDefault = index === (defaultIndex >= 0 ? defaultIndex : 0);
    });
  }

  return cleaned;
};

const deriveLegacyAddress = (addresses = [], fallbackAddress = "") => {
  const defaultAddress = addresses.find((item) => item.isDefault)?.address;
  return defaultAddress || addresses[0]?.address || fallbackAddress.trim() || "";
};

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
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  new ApiResponse(res, 200, "Current user retrieved successfully", user).send();
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

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const { name, phone = "", addresses = [], address = "" } = req.body;

  if (!String(name || "").trim()) {
    throw new ApiError(400, "Name is required");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  const nextAddresses = sanitizeAddresses(addresses, address || user.address || "");

  user.name = String(name).trim();
  user.phone = String(phone).trim();
  user.addresses = nextAddresses;
  user.address = deriveLegacyAddress(nextAddresses, address || user.address || "");

  await user.save();

  const updatedUser = await User.findById(user._id).select("-password");
  new ApiResponse(res, 200, "Profile updated successfully", updatedUser).send();
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  user.avatar = req.file.path;
  await user.save();

  const updatedUser = await User.findById(user._id).select("-password");
  new ApiResponse(res, 200, "Avatar uploaded successfully", updatedUser).send();
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "All password fields are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New passwords do not match");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.provider !== "local") {
    throw new ApiError(400, "Password changes are only available for email login accounts");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  new ApiResponse(res, 200, "Password changed successfully").send();
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");

  await user.deleteOne();

  new ApiResponse(res, 200, "Account deleted successfully").send();
});

// Update user (admin can update anyone; user can update self)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, addresses, avatar, lastLogin } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  // Authorization check
  if (req.user.role !== "admin" && req.user.id !== user._id.toString())
    throw new ApiError(403, "Not authorized");

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = await bcrypt.hash(password, 10);
  if (typeof phone === "string") user.phone = phone.trim();
  if (typeof avatar === "string") user.avatar = avatar;
  if (lastLogin) user.lastLogin = lastLogin;
  if (Array.isArray(addresses)) {
    const nextAddresses = sanitizeAddresses(addresses, typeof address === "string" ? address : user.address);
    user.addresses = nextAddresses;
    user.address = deriveLegacyAddress(nextAddresses, typeof address === "string" ? address : user.address);
  } else if (typeof address === "string") {
    user.address = address.trim();
  }

  await user.save();

  const updatedUser = await User.findById(user._id).select("-password");
  new ApiResponse(res, 200, "User updated successfully", updatedUser).send();
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
