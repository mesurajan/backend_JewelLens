import { z } from "zod";

const optionalText = (maximum) => z.string().trim().max(maximum).optional().default("");
const numericField = (schema) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
  schema.optional(),
);
const optionalDate = z.preprocess(
  (value) => value === "" || value === undefined ? null : value,
  z.union([z.coerce.date(), z.null()]),
);
const safeLink = z.string().trim().max(500).refine(
  (value) => value === "" || value.startsWith("/") || /^https:\/\//i.test(value),
  "Link must be an internal path or HTTPS URL",
);

export const heroSliderSchema = z.object({
  placement: z.enum(["homepage", "collections"]).optional().default("homepage"),
  title: z.string().trim().min(2, "Title is required").max(100),
  subtitle: optionalText(160),
  eyebrow: optionalText(80),
  description: optionalText(300),
  image: z.string().trim().url("A valid image URL is required"),
  imagePublicId: optionalText(300),
  imageAlt: optionalText(160),
  link: safeLink.optional().default("/collections"),
  primaryButtonText: optionalText(40),
  primaryButtonLink: safeLink.optional().default(""),
  secondaryButtonText: optionalText(40),
  secondaryButtonLink: safeLink.optional().default(""),
  highlightOneTitle: optionalText(60),
  highlightOneSubtitle: optionalText(100),
  highlightOneIcon: z.enum(["Gem", "ShieldCheck", "Sparkles", "Award", "BadgeCheck", "Crown", ""]).optional().default("Gem"),
  highlightTwoTitle: optionalText(60),
  highlightTwoSubtitle: optionalText(100),
  highlightTwoIcon: z.enum(["Gem", "ShieldCheck", "Sparkles", "Award", "BadgeCheck", "Crown", ""]).optional().default("ShieldCheck"),
  textAlignment: z.enum(["left", "center", "right"]).optional().default("left"),
  overlayStrength: numericField(z.number().min(0).max(100)).default(58),
  status: z.enum(["active", "inactive"]).optional(),
  order: numericField(z.number().int().nonnegative()),
  startDate: optionalDate.optional().default(null),
  endDate: optionalDate.optional().default(null),
}).superRefine((data, context) => {
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be later than start date" });
  }
});
