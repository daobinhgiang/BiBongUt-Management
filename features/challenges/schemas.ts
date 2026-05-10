import { z } from "zod";

export const challengeTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  damage: z.number().int().min(1),
});

export const createChallengeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  boss_name: z.string().min(1, "Boss name is required").max(100),
  boss_emoji: z.string(),
  template_id: z.string().nullable(),
  reward_xp: z.number().int().min(0).max(9999),
  reward_coins: z.number().int().min(0).max(9999),
  end_date: z.string().nullable(),
  participant_ids: z.array(z.string()),
  tasks: z
    .array(challengeTaskSchema)
    .min(1, "Add at least one task"),
});

export type CreateChallengeFormValues = z.infer<typeof createChallengeSchema>;
