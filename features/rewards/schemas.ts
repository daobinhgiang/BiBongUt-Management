import { z } from "zod";

export const createRewardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  cost_coins: z.number().int().min(1, "Must cost at least 1 coin").max(9999),
  icon_url: z.string().nullable(),
});

export type CreateRewardFormValues = z.infer<typeof createRewardSchema>;
