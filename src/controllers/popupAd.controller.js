import PopupAd from "../models/popupAd.model.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { popupAdSchema } from "../validations/popupAd.validation.js";

const parsePayload = (body) => {
  const validation = popupAdSchema.safeParse(body);
  if (!validation.success) {
    const message = validation.error.issues[0]?.message || "Invalid popup ad data";
    throw new ApiError(400, message);
  }

  return {
    ...validation.data,
    startsAt: validation.data.startsAt ? new Date(validation.data.startsAt) : null,
    endsAt: validation.data.endsAt ? new Date(validation.data.endsAt) : null,
  };
};

export const getPopupAds = asyncHandler(async (_req, res) => {
  const ads = await PopupAd.find().sort({ priority: -1, updatedAt: -1 });
  new ApiResponse(res, 200, "Popup ads fetched", ads).send();
});

export const getActivePopupAd = asyncHandler(async (_req, res) => {
  const now = new Date();
  const ad = await PopupAd.findOne({
    status: "active",
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  }).sort({ priority: -1, updatedAt: -1 });

  new ApiResponse(res, 200, ad ? "Active popup ad fetched" : "No active popup ad", ad).send();
});

export const createPopupAd = asyncHandler(async (req, res) => {
  const ad = await PopupAd.create(parsePayload(req.body));
  new ApiResponse(res, 201, "Popup ad created", ad).send();
});

export const updatePopupAd = asyncHandler(async (req, res) => {
  const ad = await PopupAd.findById(req.params.id);
  if (!ad) throw new ApiError(404, "Popup ad not found");

  Object.assign(ad, parsePayload(req.body));
  await ad.save();
  new ApiResponse(res, 200, "Popup ad updated", ad).send();
});

export const deletePopupAd = asyncHandler(async (req, res) => {
  const ad = await PopupAd.findById(req.params.id);
  if (!ad) throw new ApiError(404, "Popup ad not found");

  await ad.deleteOne();
  new ApiResponse(res, 200, "Popup ad deleted").send();
});
