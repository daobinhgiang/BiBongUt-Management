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
export type TaskType = Enums["task_type"];

// ── Joined query results ──
export type TaskWithAssignee = Task & {
  assignee: { id: string; nickname: string } | null;
  creator: { id: string; nickname: string };
};

export type TaskCompletionWithMember = TaskCompletion & {
  completed_by_member: { id: string; nickname: string } | null;
};

// Re-export shared date helpers
export {
  localToday,
  localTimezone,
  isDueToday,
  isOverdue,
  formatDeadlineLocal,
} from "@/lib/date";

// ── Filter types used by the UI ──
export type TaskFilter =
  | "all"
  | "mine"
  | "mine_today"
  | "today"
  | "overdue"
  | "done"
  | "challenges";

// ── Challenge tasks shown on the main task list ──
export type ChallengeTaskForList = TaskWithAssignee & {
  challenge_title: string;
  damage: number;
};
