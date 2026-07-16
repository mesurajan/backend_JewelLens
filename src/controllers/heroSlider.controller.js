import HeroSlider from "../models/heroSlider.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import { heroSliderSchema } from "../validations/heroSlider.validation.js";

const publicFields = [
  "title", "subtitle", "eyebrow", "description", "image", "imageAlt", "link",
  "primaryButtonText", "primaryButtonLink", "secondaryButtonText", "secondaryButtonLink",
  "highlightOneTitle", "highlightOneSubtitle", "highlightOneIcon",
  "highlightTwoTitle", "highlightTwoSubtitle", "highlightTwoIcon",
  "textAlignment", "overlayStrength", "status", "order", "startDate", "endDate",
].join(" ");

const placementQuery = (placement) => placement === "homepage"
  ? { $or: [{ placement: "homepage" }, { placement: { $exists: false } }] }
  : { placement };

const normalizePayload = (body = {}, file, existing = {}) => {
  const payload = { ...existing, ...body };

  if (file?.path) payload.image = file.path;
  if (file?.filename) payload.imagePublicId = file.filename;

  return payload;
};

const validatePayload = (payload) => {
  const validation = heroSliderSchema.safeParse(payload);
  if (!validation.success) {
    const issue = validation.error.issues[0];
    throw new ApiError(400, issue?.message || "Invalid hero slider data");
  }
  return validation.data;
};

const destroyOwnedImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.warn("Unable to clean up hero slider image", { publicId, message: error.message });
  }
};

export const createHeroSlider = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, req.file);
  let data;

  try {
    data = validatePayload(payload);
    const highestOrder = await HeroSlider.findOne(placementQuery(data.placement)).sort({ order: -1 });
    const order = typeof data.order === "number" ? data.order : highestOrder ? highestOrder.order + 1 : 1;
    const slider = await HeroSlider.create({ ...data, order });
    return new ApiResponse(res, 201, "Hero slider created", slider).send();
  } catch (error) {
    await destroyOwnedImage(req.file?.filename);
    throw error;
  }
});

export const getHeroSliders = asyncHandler(async (req, res) => {
  const placement = String(req.query.placement || "").trim();

  // Preserve the original homepage endpoint behavior for existing clients.
  if (!placement) {
    const sliders = await HeroSlider.find().sort({ order: 1 });
    return new ApiResponse(res, 200, "Hero sliders fetched", sliders).send();
  }

  if (!['homepage', 'collections'].includes(placement)) {
    throw new ApiError(400, "Invalid slider placement");
  }

  const now = new Date();
  const slides = await HeroSlider.find({
    ...placementQuery(placement),
    status: "active",
    $and: [
      { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }] },
    ],
  })
    .select(publicFields)
    .sort({ order: 1, createdAt: 1 })
    .lean();

  new ApiResponse(res, 200, "Public hero sliders fetched", slides).send();
});

export const getAdminHeroSliders = asyncHandler(async (req, res) => {
  const placement = String(req.query.placement || "homepage").trim();
  if (!['homepage', 'collections'].includes(placement)) {
    throw new ApiError(400, "Invalid slider placement");
  }

  const slides = await HeroSlider.find(placementQuery(placement)).sort({ order: 1, createdAt: 1 });
  new ApiResponse(res, 200, "Admin hero sliders fetched", slides).send();
});

export const updateHeroSlider = asyncHandler(async (req, res) => {
  const slider = await HeroSlider.findById(req.params.id);
  if (!slider) {
    await destroyOwnedImage(req.file?.filename);
    throw new ApiError(404, "Hero slider not found");
  }

  const previousPublicId = slider.imagePublicId;
  const payload = normalizePayload(req.body, req.file, slider.toObject());

  try {
    const data = validatePayload(payload);
    Object.assign(slider, data);
    await slider.save();
  } catch (error) {
    await destroyOwnedImage(req.file?.filename);
    throw error;
  }

  if (req.file?.filename && previousPublicId && previousPublicId !== req.file.filename) {
    await destroyOwnedImage(previousPublicId);
  }

  new ApiResponse(res, 200, "Hero slider updated", slider).send();
});

export const deleteHeroSlider = asyncHandler(async (req, res) => {
  const slider = await HeroSlider.findById(req.params.id);
  if (!slider) throw new ApiError(404, "Hero slider not found");

  const publicId = slider.imagePublicId;
  await slider.deleteOne();
  await destroyOwnedImage(publicId);

  new ApiResponse(res, 200, "Hero slider deleted").send();
});
