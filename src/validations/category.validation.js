import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  icon: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});