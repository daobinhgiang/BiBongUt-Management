import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

// ── Row types straight from the generated schema ──
export type Task = Tables["tasks"]["Row"];
export type TaskInsert = Tables["tasks"]["Insert"];
export type TaskUpdate = Tables["tasks"]["Update"];
export type TaskCompletion = Tables["task_completions"]["Row"];
export type TaskCompletionInsert = Tables["task_completions"]["Insert"];

// ── Enums ──
export type TaskDifficulty = Enums["task_difficulty"];
export type TaskRecurrence = Enums["task_recurrence"];

// ── Joined query results ──
export type TaskWithAssignee = Task & {
  assignee: { id: string; nickname: string } | null;
  creator: { id: string; nickname: string };
};

export type TaskCompletionWithMember = TaskCompletion & {
  completed_by_member: { id: string; nickname: string } | null;
};

// ── Difficulty → default points/coins mapping ──
export const DIFFICULTY_DEFAULTS: Record<
  TaskDifficulty,
  { points: number; coins: number }
> = {
  easy: { points: 5, coins: 2 },
  medium: { points: 15, coins: 7 },
  hard: { points: 50, coins: 25 },
};

// Re-export shared date helper for backwards compatibility
export { localToday } from "@/lib/date";

// ── Filter types used by the UI ──
export type TaskFilter =
  | "all"
  | "mine"
  | "today"
  | "overdue"
  | "done";
