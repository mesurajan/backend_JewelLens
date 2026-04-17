import Occasion from "../models/occasion.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { occasionSchema } from "../validations/occasion.validation.js";

export const createOccasion = asyncHandler(async (req, res) => {
  const validation = occasionSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Occasion validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid occasion data");
  }

  const occasion = await Occasion.create(validation.data);
  new ApiResponse(res, 201, "Occasion created", occasion).send();
});

export const getOccasions = asyncHandler(async (req, res) => {
  const occasions = await Occasion.find().sort({ name: 1 });
  new ApiResponse(res, 200, "Occasions fetched", occasions).send();
});

export const updateOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) throw new ApiError(404, "Occasion not found");

  const validation = occasionSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Occasion validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid occasion data");
  }

  Object.assign(occasion, validation.data);
  await occasion.save();

  new ApiResponse(res, 200, "Occasion updated", occasion).send();
});

export const deleteOccasion = asyncHandler(async (req, res) => {
  const occasion = await Occasion.findById(req.params.id);
  if (!occasion) throw new ApiError(404, "Occasion not found");

  await occasion.deleteOne();
  new ApiResponse(res, 200, "Occasion deleted").send();
});
