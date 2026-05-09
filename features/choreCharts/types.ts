import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type ChoreChart = Tables["chore_charts"]["Row"];
export type ChoreChartInsert = Tables["chore_charts"]["Insert"];
export type ChoreChartSlot = Tables["chore_chart_slots"]["Row"];

export type ChoreScheduleType = Enums["chore_schedule_type"];

export type ChoreChartWithSlots = ChoreChart & {
  chore_chart_slots: (ChoreChartSlot & {
    assignee: { id: string; nickname: string };
  })[];
};

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const DIFFICULTY_DEFAULTS: Record<
  string,
  { points: number; coins: number }
> = {
  easy: { points: 5, coins: 2 },
  medium: { points: 15, coins: 7 },
  hard: { points: 50, coins: 25 },
};
