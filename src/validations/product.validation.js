import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
 category: z.preprocess(
  (val) => {
    // If an object with _id is sent, extract _id
    if (typeof val === "object" && val !== null && "_id" in val) {
      return val._id;
    }
    return val;
  },
  z.string().min(1, "Category is required")
),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  stockCount: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  material: z.string().optional(),
  weight: z.string().optional(),
  images: z.array(z.string().url()).optional().default([]),
  variants: z
    .array(
      z.object({
        type: z.string(),
        label: z.string(),
        options: z.array(
          z.object({ value: z.string(), priceAdjustment: z.number() })
        ),
      })
    )
    .optional()
    .default([]),
specifications: z
  .object({}).catchall(z.string())
  .optional()
  .default({}),

  careInstructions: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional()
    .default([]),
  craftsmanshipStory: z.string().optional(),
  warranty: z.string().optional(),
  returnPolicy: z.string().optional(),
  estimatedDeliveryDays: z.number().optional(),
  freeShipping: z.boolean().optional(),
  codAvailable: z.boolean().optional(),
  emiAvailable: z.boolean().optional(),
  offerBadge: z.string().optional(),
  offerEndsAt: z.string().optional(),
  featured: z.boolean().optional(),
});