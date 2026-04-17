import { z } from "zod";

export const brandPartnerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  logo: z.string().min(5, "Logo URL is required"),
  status: z.enum(["active", "inactive"]).optional(),
});
