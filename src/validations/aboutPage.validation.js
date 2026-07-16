import { z } from "zod";
import { aboutIconNames } from "../models/aboutPage.model.js";

const text = (max) => z.string().trim().max(max).optional().default("");
const bool = z.preprocess((v) => typeof v === "string" ? v === "true" : v, z.boolean()).optional().default(true);
const number = (min, max) => z.preprocess((v) => Number(v), z.number().min(min).max(max));
const link = z.string().trim().max(500).refine((v) => !v || v.startsWith("/") || /^https:\/\//i.test(v), "Invalid link").optional().default("");
const icon = z.enum(aboutIconNames);
const position = z.enum(["center", "top", "bottom", "left", "right"]);
const imageUrl = z.string().trim().refine((v) => !v || /^https:\/\//i.test(v), "Invalid image URL").optional().default("");
const imageCard = z.object({ title: text(100), paragraphs: z.array(z.string().trim().min(1).max(1000)).max(6).optional().default([]), icon, imageUrl, imagePublicId: text(300), imageAlt: text(160), imagePosition: position.optional().default("center") });

export const aboutSectionSchemas = {
  hero: z.object({ eyebrow: text(80), title: z.string().trim().min(2).max(120), description: text(600), primaryButtonText: text(40), primaryButtonLink: link, secondaryButtonText: text(40), secondaryButtonLink: link, imageUrl, imagePublicId: text(300), imageAlt: text(160), imagePosition: position.optional().default("center"), overlayStrength: number(0, 100).optional().default(55), isActive: bool }),
  missionVision: z.object({ eyebrow: text(80), heading: text(120), missionTitle: text(100), missionDescription: text(600), missionIcon: icon, visionTitle: text(100), visionDescription: text(600), visionIcon: icon, isActive: bool }),
  ethicsPromise: z.object({ eyebrow: text(80), heading: text(120), ethics: imageCard, promise: imageCard, isActive: bool }),
  callToAction: z.object({ eyebrow: text(80), title: z.string().trim().min(2).max(120), description: text(400), primaryButtonText: text(40), primaryButtonLink: link, secondaryButtonText: text(40), secondaryButtonLink: link, backgroundImageUrl: imageUrl, backgroundImagePublicId: text(300), isActive: bool }),
};
export const aboutItemSchemas = {
  statistics: z.object({ value: z.string().trim().min(1).max(30), suffix: text(10), label: z.string().trim().min(2).max(80), icon, sortOrder: number(0, 10000), isActive: bool }),
  coreValues: z.object({ title: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(500), icon, sortOrder: number(0, 10000), isActive: bool }),
  benefits: z.object({ title: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(500), icon, sortOrder: number(0, 10000), isActive: bool }),
};
