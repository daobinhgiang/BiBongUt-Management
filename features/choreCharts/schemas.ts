import { z } from "zod";

const slotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  assignee_id: z.string().uuid(),
});

export const choreChartSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(1000).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    points: z.number().int().min(0).max(999),
    coins_reward: z.number().int().min(0).max(999),
    schedule_type: z.enum(["fixed", "rotate_weekly"]),
    slots: z.array(slotSchema),
    rotation_members: z.array(z.string()),
  })
  .refine(
    (data) => data.schedule_type !== "fixed" || data.slots.length >= 1,
    { message: "Assign at least one day", path: ["slots"] },
  )
  .refine(
    (data) => data.schedule_type !== "rotate_weekly" || data.rotation_members.length >= 2,
    { message: "Need at least 2 members to rotate", path: ["rotation_members"] },
  );

export type ChoreChartFormValues = z.infer<typeof choreChartSchema>;
