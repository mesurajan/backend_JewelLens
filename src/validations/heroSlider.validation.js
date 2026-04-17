import { z } from "zod";

export const heroSliderSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().min(5, "Image URL is required"),
  link: z.string().min(1, "Link is required"),
  status: z.enum(["active", "inactive"]).optional(),
  order: z.number().int().nonnegative().optional(),
});
