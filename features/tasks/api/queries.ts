import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { TaskWithAssignee, TaskCompletionWithMember } from "../types";

const TASK_SELECT =
  "*, assignee:family_members!tasks_assignee_id_fkey(id, nickname), creator:family_members!tasks_created_by_fkey(id, nickname)";

export const taskKeys = {
  all: (familyId: string) => ["tasks", familyId] as const,
  done: (familyId: string) => ["tasks", "done", familyId] as const,
  detail: (taskId: string) => ["tasks", "detail", taskId] as const,
  completions: (taskId: string) =>
    ["tasks", "completions", taskId] as const,
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
  const { data: family } = useFamily();

  return useQuery({
    queryKey: taskKeys.all(family?.family_id ?? ""),
    queryFn: () => fetchTasks(family!.family_id),
    enabled: !!family?.family_id,
  });
}

export function useCompletedTasks() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: taskKeys.done(family?.family_id ?? ""),
    queryFn: () => fetchCompletedTasks(family!.family_id),
    enabled: !!family?.family_id,
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
