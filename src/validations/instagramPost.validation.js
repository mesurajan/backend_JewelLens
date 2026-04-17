import { z } from "zod";

export const instagramPostSchema = z.object({
  image: z.string().min(5, "Image URL is required"),
  caption: z.string().optional(),
  likes: z.number().int().nonnegative().optional(),
  link: z.string().min(1, "Link is required"),
  status: z.enum(["active", "inactive"]).optional(),
});
