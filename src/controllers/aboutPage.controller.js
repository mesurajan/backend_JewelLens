import AboutPage from "../models/aboutPage.model.js";
import cloudinary from "../config/cloudinary.js";
import asyncHandler from "../middleware/async.middleware.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { aboutItemSchemas, aboutSectionSchemas } from "../validations/aboutPage.validation.js";
import { ABOUT_CONTENT_VERSION, defaultAboutPageContent } from "../data/aboutPage.defaults.js";

const parseData = (body = {}) => {
  if (typeof body.data !== "string") return body;
  try { return JSON.parse(body.data); } catch { throw new ApiError(400, "Invalid About page data"); }
};
const firstFile = (req, name) => req.files?.[name]?.[0];
const destroy = async (publicId) => {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); }
  catch (error) { console.warn("Unable to clean up About image", { publicId, message: error.message }); }
};
const isBlank = (value) => value === undefined || value === null || (typeof value === "string" && !value.trim());
const fillMissing = (current, defaults) => {
  if (Array.isArray(defaults)) return Array.isArray(current) && current.length ? current : structuredClone(defaults);
  if (!defaults || typeof defaults !== "object") return isBlank(current) ? defaults : current;
  const source = current?.toObject?.() || current || {};
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, fillMissing(source[key], fallback)]));
};
const getOrCreate = async () => {
  let page = await AboutPage.findOne({ pageKey: "about" });
  if (!page) return AboutPage.create(structuredClone(defaultAboutPageContent));
  if ((page.contentVersion || 0) < ABOUT_CONTENT_VERSION) {
    for (const key of ["hero", "statistics", "missionVision", "coreValues", "benefits", "ethicsPromise", "callToAction"]) {
      page[key] = fillMissing(page[key], defaultAboutPageContent[key]);
    }
    page.contentVersion = ABOUT_CONTENT_VERSION;
    await page.save();
  }
  return page;
};
const validate = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiError(400, result.error.issues[0]?.message || "Invalid About page data");
  return result.data;
};
const cleanPublic = (document) => {
  const data = document.toObject ? document.toObject() : structuredClone(document);
  delete data._id; delete data.__v; delete data.pageKey; delete data.isPublished; delete data.contentVersion; delete data.createdAt; delete data.updatedAt;
  if (data.hero) delete data.hero.imagePublicId;
  if (data.ethicsPromise?.ethics) delete data.ethicsPromise.ethics.imagePublicId;
  if (data.ethicsPromise?.promise) delete data.ethicsPromise.promise.imagePublicId;
  if (data.callToAction) delete data.callToAction.backgroundImagePublicId;
  for (const key of ["statistics", "coreValues", "benefits"]) {
    data[key] = (data[key] || []).filter((item) => item.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  for (const key of ["hero", "missionVision", "ethicsPromise", "callToAction"]) {
    if (data[key]?.isActive === false) data[key] = null;
  }
  return data;
};

export const getPublicAboutPage = asyncHandler(async (_req, res) => {
  const page = await getOrCreate();
  new ApiResponse(res, 200, "About page fetched", page.isPublished ? cleanPublic(page) : null).send();
});
export const getAdminAboutPage = asyncHandler(async (_req, res) => {
  const page = await getOrCreate();
  new ApiResponse(res, 200, "About page admin data fetched", page).send();
});

export const updateAboutSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const schema = aboutSectionSchemas[section];
  if (!schema) throw new ApiError(404, "About section not found");
  const page = await getOrCreate();
  const incoming = parseData(req.body);
  const payload = { ...(page[section]?.toObject?.() || page[section] || {}), ...incoming };
  const uploaded = [];
  const replacements = [];

  const applyFile = (name, target, urlKey, publicIdKey) => {
    const file = firstFile(req, name);
    if (!file) return;
    uploaded.push(file.filename);
    if (target[publicIdKey]) replacements.push(target[publicIdKey]);
    target[urlKey] = file.path;
    target[publicIdKey] = file.filename;
  };
  if (section === "hero") applyFile("imageFile", payload, "imageUrl", "imagePublicId");
  if (section === "callToAction") applyFile("backgroundImage", payload, "backgroundImageUrl", "backgroundImagePublicId");
  if (section === "ethicsPromise") {
    payload.ethics = { ...(page.ethicsPromise?.ethics?.toObject?.() || {}), ...(incoming.ethics || {}) };
    payload.promise = { ...(page.ethicsPromise?.promise?.toObject?.() || {}), ...(incoming.promise || {}) };
    applyFile("ethicsImage", payload.ethics, "imageUrl", "imagePublicId");
    applyFile("promiseImage", payload.promise, "imageUrl", "imagePublicId");
  }

  try {
    page[section] = validate(schema, payload);
    await page.save();
  } catch (error) {
    await Promise.all(uploaded.map(destroy));
    throw error;
  }
  await Promise.all(replacements.filter((id) => !uploaded.includes(id)).map(destroy));
  new ApiResponse(res, 200, "About section updated", page).send();
});

export const createAboutItem = asyncHandler(async (req, res) => {
  const { collection } = req.params;
  const schema = aboutItemSchemas[collection];
  if (!schema) throw new ApiError(404, "About collection not found");
  const page = await getOrCreate();
  page[collection].push(validate(schema, req.body));
  await page.save();
  new ApiResponse(res, 201, "About item created", page[collection].at(-1)).send();
});
export const updateAboutItem = asyncHandler(async (req, res) => {
  const { collection, itemId } = req.params;
  const schema = aboutItemSchemas[collection];
  if (!schema) throw new ApiError(404, "About collection not found");
  const page = await AboutPage.findOne({ pageKey: "about" });
  const item = page?.[collection]?.id(itemId);
  if (!item) throw new ApiError(404, "About item not found");
  Object.assign(item, validate(schema, { ...item.toObject(), ...req.body }));
  await page.save();
  new ApiResponse(res, 200, "About item updated", item).send();
});
export const deleteAboutItem = asyncHandler(async (req, res) => {
  const { collection, itemId } = req.params;
  if (!aboutItemSchemas[collection]) throw new ApiError(404, "About collection not found");
  const page = await AboutPage.findOne({ pageKey: "about" });
  const item = page?.[collection]?.id(itemId);
  if (!item) throw new ApiError(404, "About item not found");
  item.deleteOne();
  await page.save();
  new ApiResponse(res, 200, "About item deleted").send();
});
