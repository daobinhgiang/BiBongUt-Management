import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(1000).optional(),
    start_at: z.string().min(1, "Start date is required"),
    end_at: z.string().min(1, "End date is required"),
    all_day: z.boolean(),
    attendee_ids: z.array(z.string().uuid()),
  })
  .refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: "End must be after start",
    path: ["end_at"],
  });

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
