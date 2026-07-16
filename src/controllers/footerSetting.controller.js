import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import FooterSetting from "../models/footerSetting.model.js";

const sanitizeLinks = (links = []) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item, index) => ({
      label: String(item?.label || "").trim(),
      to: String(item?.to || "").trim(),
      icon: String(item?.icon || "").trim().replace(/[^a-zA-Z0-9]/g, ""),
      isActive: item?.isActive !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index,
    }))
    .filter((item) => item.label && (/^\//.test(item.to) || /^https?:\/\//i.test(item.to)));
};

const sanitizeSocialLinks = (links = []) => {
  if (!Array.isArray(links)) return [];

  return links
    .map((item, index) => ({
      platform: String(item?.platform || "").trim().slice(0, 50),
      url: String(item?.url || "").trim(),
      isActive: item?.isActive !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index,
    }))
    .filter((item) => item.platform && /^https?:\/\/[^\s]+$/i.test(item.url));
};

const sanitizeTrustItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => ({
      title: String(item?.title || "").trim().slice(0, 100),
      subtitle: String(item?.subtitle || "").trim().slice(0, 180),
      icon: String(item?.icon || "ShieldCheck").trim().replace(/[^a-zA-Z0-9]/g, "") || "ShieldCheck",
      isActive: item?.isActive !== false,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index,
    }))
    .filter((item) => item.title);
};

const sanitizeOptionalUrl = (value) => {
  const url = String(value || "").trim();
  return !url || /^https?:\/\/[^\s]+$/i.test(url) ? url : "";
};

const sanitizeFooterPayload = (payload = {}) => ({
  brandName: String(payload.brandName || "JewelLens").trim(),
  logoUrl: sanitizeOptionalUrl(payload.logoUrl),
  tagline: String(payload.tagline || "").trim(),
  description: String(payload.description || "").trim(),
  highlightText: String(payload.highlightText || "").trim(),
  phone: String(payload.phone || "").trim(),
  email: String(payload.email || "").trim().toLowerCase(),
  addressLine1: String(payload.addressLine1 || "").trim(),
  addressLine2: String(payload.addressLine2 || "").trim(),
  copyrightText: String(payload.copyrightText || "").trim(),
  shopLinks: sanitizeLinks(payload.shopLinks),
  companyLinks: sanitizeLinks(payload.companyLinks),
  socialLinks: sanitizeSocialLinks(payload.socialLinks),
  trustItems: sanitizeTrustItems(payload.trustItems),
  isActive: payload.isActive !== false,
});

export const getPublicFooterSetting = asyncHandler(async (_req, res) => {
  const footerDocument = await FooterSetting.findOne({ isActive: true }).sort({ updatedAt: -1, createdAt: -1 });
  const footer = footerDocument?.toObject() || null;

  if (footer) {
    for (const key of ["shopLinks", "companyLinks", "socialLinks", "trustItems"]) {
      footer[key] = (footer[key] || [])
        .filter((item) => item.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  }
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

  const payload = sanitizeFooterPayload({ ...footer.toObject(), ...req.body });
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
