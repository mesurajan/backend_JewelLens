import BrandPartner from "../models/brandPartner.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { brandPartnerSchema } from "../validations/brandPartner.validation.js";

export const createBrandPartner = asyncHandler(async (req, res) => {
  const validation = brandPartnerSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Brand partner validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid brand partner data");
  }

  const partner = await BrandPartner.create(validation.data);
  new ApiResponse(res, 201, "Brand partner created", partner).send();
});

export const getBrandPartners = asyncHandler(async (req, res) => {
  const partners = await BrandPartner.find().sort({ name: 1 });
  new ApiResponse(res, 200, "Brand partners fetched", partners).send();
});

export const updateBrandPartner = asyncHandler(async (req, res) => {
  const partner = await BrandPartner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Brand partner not found");

  const validation = brandPartnerSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Brand partner validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid brand partner data");
  }

  Object.assign(partner, validation.data);
  await partner.save();

  new ApiResponse(res, 200, "Brand partner updated", partner).send();
});

export const deleteBrandPartner = asyncHandler(async (req, res) => {
  const partner = await BrandPartner.findById(req.params.id);
  if (!partner) throw new ApiError(404, "Brand partner not found");

  await partner.deleteOne();
  new ApiResponse(res, 200, "Brand partner deleted").send();
});
