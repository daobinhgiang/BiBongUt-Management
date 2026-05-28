import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { localToday, localTimezone } from "@/lib/date";
import type { TaskWithAssignee, TaskCompletionWithMember, ChallengeTaskForList } from "../types";

const TASK_SELECT =
  "*, assignee:family_members!tasks_assignee_id_fkey(id, nickname), creator:family_members!tasks_created_by_fkey(id, nickname)";

export const taskKeys = {
  all: (familyId: string) => ["tasks", familyId] as const,
  done: (familyId: string) => ["tasks", "done", familyId] as const,
  detail: (taskId: string) => ["tasks", "detail", taskId] as const,
  completions: (taskId: string) =>
    ["tasks", "completions", taskId] as const,
  challengeTasks: (familyId: string) =>
    ["tasks", "challenge", familyId] as const,
  todayCompletions: (memberId: string) =>
    ["tasks", "todayCompletions", memberId] as const,
  dailyChestClaimed: (memberId: string) =>
    ["tasks", "dailyChestClaimed", memberId] as const,
};

// ── Fetch all active tasks for the family ──
async function fetchTasks(familyId: string): Promise<TaskWithAssignee[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("family_id", familyId)
    .eq("is_active", true)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data as unknown as TaskWithAssignee[];
}

// ── Fetch completed (inactive) tasks for the family ──
async function fetchCompletedTasks(familyId: string): Promise<TaskWithAssignee[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("family_id", familyId)
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as unknown as TaskWithAssignee[];
}

// ── Fetch a single task by ID ──
async function fetchTask(taskId: string): Promise<TaskWithAssignee> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return data as unknown as TaskWithAssignee;
}

// ── Fetch completions for a task ──
async function fetchTaskCompletions(taskId: string): Promise<TaskCompletionWithMember[]> {
  const { data, error } = await supabase
    .from("task_completions")
    .select("*, completed_by_member:family_members!task_completions_completed_by_fkey(id, nickname)")
    .eq("task_id", taskId)
    .order("completed_at", { ascending: false });

  if (error) throw error;
  return data as unknown as TaskCompletionWithMember[];
}

// ── Hooks ──

export function useTasks() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: taskKeys.all(member?.family_id ?? ""),
    queryFn: () => fetchTasks(member!.family_id),
    enabled: !!member?.family_id,
  });
}

export function useCompletedTasks(enabled = true) {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: taskKeys.done(member?.family_id ?? ""),
    queryFn: () => fetchCompletedTasks(member!.family_id),
    enabled: enabled && !!member?.family_id,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: !!taskId,
  });
}

export function useTaskCompletions(taskId: string) {
  return useQuery({
    queryKey: taskKeys.completions(taskId),
    queryFn: () => fetchTaskCompletions(taskId),
    enabled: !!taskId,
  });
}

// ── Challenge tasks shown on the main task list ──

const CHALLENGE_TASK_SELECT = `
  ${TASK_SELECT},
  challenge_tasks!inner(damage, show_on_task_list, challenge:challenges!challenge_tasks_challenge_id_fkey(title))
`;

async function fetchChallengeTasks(familyId: string): Promise<ChallengeTaskForList[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(CHALLENGE_TASK_SELECT)
    .eq("family_id", familyId)
    .eq("is_active", true)
    .eq("challenge_tasks.show_on_task_list", true)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;

  // Flatten the nested join
  return (data as any[]).map((row) => {
    const ct = row.challenge_tasks[0];
    const { challenge_tasks: _, ...task } = row;
    return {
      ...task,
      challenge_title: ct.challenge?.title ?? "",
      damage: ct.damage,
    } as ChallengeTaskForList;
  });
}

export function useChallengeTasks() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: taskKeys.challengeTasks(member?.family_id ?? ""),
    queryFn: () => fetchChallengeTasks(member!.family_id),
    enabled: !!member?.family_id,
  });
}

// ── Today's completion count for hero progress ring ──

async function fetchTodayCompletionCount(memberId: string): Promise<number> {
  const today = localToday(); // YYYY-MM-DD
  const { count, error } = await supabase
    .from("task_completions")
    .select("*", { count: "exact", head: true })
    .eq("completed_by", memberId)
    .gte("completed_at", `${today}T00:00:00`)
    .lt("completed_at", `${today}T23:59:59.999`);

  if (error) throw error;
  return count ?? 0;
}

export function useTodayCompletionCount() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: taskKeys.todayCompletions(member?.id ?? ""),
    queryFn: () => fetchTodayCompletionCount(member!.id),
    enabled: !!member?.id,
  });
}

// ── Daily chest claimed today? ──

async function fetchDailyChestClaimed(memberId: string): Promise<boolean> {
  const today = localToday();
  const { count, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("family_member_id", memberId)
    .eq("ref_table", "daily_chest")
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59.999`);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export function useDailyChestClaimed() {
  const { data: member } = useCurrentMember();

  return useQuery({
    queryKey: taskKeys.dailyChestClaimed(member?.id ?? ""),
    queryFn: () => fetchDailyChestClaimed(member!.id),
    enabled: !!member?.id,
  });
}
