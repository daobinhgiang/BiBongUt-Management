import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  assignee_id: z.string().uuid().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().int().min(0).max(999),
  coins_reward: z.number().int().min(0).max(999),
  due_date: z.string().nullable(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;
