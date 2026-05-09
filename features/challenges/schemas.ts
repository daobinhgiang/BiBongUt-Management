import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["solo", "collaborative", "boss_battle"]),
  target_value: z.number().int().min(1, "Target must be at least 1"),
  unit: z.string().min(1, "Unit is required").max(50),
  end_date: z.string().nullable(),
  reward_xp: z.number().int().min(0).max(9999),
  reward_coins: z.number().int().min(0).max(9999),
  participant_ids: z.array(z.string()),
});

export type CreateChallengeFormValues = z.infer<typeof createChallengeSchema>;
