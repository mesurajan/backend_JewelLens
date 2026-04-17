import { z } from "zod";

export const occasionSchema = z.object({
  name: z.string().min(2, "Name is required"),
  icon: z.string().optional(),
  image: z.string().min(5, "Image URL is required"),
  link: z.string().min(1, "Link is required"),
  status: z.enum(["active", "inactive"]).optional(),
});
