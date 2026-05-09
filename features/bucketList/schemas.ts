import { z } from "zod";

export const createBucketListItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(["travel", "experience", "skill", "other"]),
  priority: z.enum(["small", "medium", "large"]),
  target_date: z.string().nullable(),
});

export type CreateBucketListFormValues = z.infer<typeof createBucketListItemSchema>;
