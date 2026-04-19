import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import FooterSetting from "../models/footerSetting.model.js";

const sanitizeLinks = (links = []) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item) => ({
      label: String(item?.label || "").trim(),
      to: String(item?.to || "").trim(),
    }))
    .filter((item) => item.label && item.to);
};

const sanitizeFooterPayload = (payload = {}) => ({
  brandName: String(payload.brandName || "JewelLens").trim(),
  description: String(payload.description || "").trim(),
  phone: String(payload.phone || "").trim(),
  email: String(payload.email || "").trim().toLowerCase(),
  addressLine1: String(payload.addressLine1 || "").trim(),
  addressLine2: String(payload.addressLine2 || "").trim(),
  copyrightText: String(payload.copyrightText || "").trim(),
  shopLinks: sanitizeLinks(payload.shopLinks),
  companyLinks: sanitizeLinks(payload.companyLinks),
  isActive: payload.isActive !== false,
});

export const getPublicFooterSetting = asyncHandler(async (_req, res) => {
  const footer = await FooterSetting.findOne({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });
  new ApiResponse(res, 200, "Footer setting fetched", footer).send();
});

export const getAdminFooterSettings = asyncHandler(async (_req, res) => {
  const items = await FooterSetting.find().sort({ updatedAt: -1, createdAt: -1 });
  new ApiResponse(res, 200, "Footer settings fetched", items).send();
});

export const createFooterSetting = asyncHandler(async (req, res) => {
  const payload = sanitizeFooterPayload(req.body);

  if (!payload.brandName) {
    throw new ApiError(400, "Brand name is required");
  }

  if (payload.isActive) {
    await FooterSetting.updateMany({}, { $set: { isActive: false } });
  }

  const footer = await FooterSetting.create(payload);
  new ApiResponse(res, 201, "Footer setting created", footer).send();
});

export const updateFooterSetting = asyncHandler(async (req, res) => {
  const footer = await FooterSetting.findById(req.params.id);
  if (!footer) throw new ApiError(404, "Footer setting not found");

  const payload = sanitizeFooterPayload(req.body);
  if (!payload.brandName) {
    throw new ApiError(400, "Brand name is required");
  }

  if (payload.isActive) {
    await FooterSetting.updateMany({ _id: { $ne: footer._id } }, { $set: { isActive: false } });
  }

  Object.assign(footer, payload);
  await footer.save();

  new ApiResponse(res, 200, "Footer setting updated", footer).send();
});

export const deleteFooterSetting = asyncHandler(async (req, res) => {
  const footer = await FooterSetting.findById(req.params.id);
  if (!footer) throw new ApiError(404, "Footer setting not found");

  await footer.deleteOne();
  new ApiResponse(res, 200, "Footer setting deleted").send();
});
