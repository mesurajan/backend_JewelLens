import HeroSlider from "../models/heroSlider.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { heroSliderSchema } from "../validations/heroSlider.validation.js";

export const createHeroSlider = asyncHandler(async (req, res) => {
  const validation = heroSliderSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Hero slider validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid hero slider data");
  }

  const data = validation.data;
  const highestOrder = await HeroSlider.findOne().sort({ order: -1 });
  const order = typeof data.order === "number" ? data.order : highestOrder ? highestOrder.order + 1 : 1;

  const slider = await HeroSlider.create({ ...data, order });
  new ApiResponse(res, 201, "Hero slider created", slider).send();
});

export const getHeroSliders = asyncHandler(async (req, res) => {
  const sliders = await HeroSlider.find().sort({ order: 1 });
  new ApiResponse(res, 200, "Hero sliders fetched", sliders).send();
});

export const updateHeroSlider = asyncHandler(async (req, res) => {
  const slider = await HeroSlider.findById(req.params.id);
  if (!slider) throw new ApiError(404, "Hero slider not found");

  const validation = heroSliderSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("Hero slider validation errors:", validation.error.format());
    throw new ApiError(400, "Invalid hero slider data");
  }

  Object.assign(slider, validation.data);
  await slider.save();

  new ApiResponse(res, 200, "Hero slider updated", slider).send();
});

export const deleteHeroSlider = asyncHandler(async (req, res) => {
  const slider = await HeroSlider.findById(req.params.id);
  if (!slider) throw new ApiError(404, "Hero slider not found");

  await slider.deleteOne();
  new ApiResponse(res, 200, "Hero slider deleted").send();
});
