import { z } from "zod";

const optionalDate = z.union([z.iso.datetime(), z.literal(""), z.null()]).optional();

export const popupAdSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    eyebrow: z.string().trim().max(120).optional().default("Exclusive offer"),
    headline: z.string().trim().min(2).max(180),
    description: z.string().trim().min(2).max(2000),
    image: z.string().trim().min(5).max(2000),
    imageAlt: z.string().trim().max(180).optional().default(""),
    ctaLabel: z.string().trim().min(1).max(60),
    ctaLink: z.string().trim().min(1).max(2000),
    highlights: z.array(z.string().trim().min(1).max(80)).max(6).optional().default([]),
    status: z.enum(["active", "inactive"]).optional().default("inactive"),
    startsAt: optionalDate,
    endsAt: optionalDate,
    displayDelaySeconds: z.number().int().min(0).max(60).optional().default(2),
    frequency: z.enum(["always", "once_session", "once_day"]).optional().default("once_session"),
    priority: z.number().int().min(0).max(999).optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after start date" });
    }
  });
