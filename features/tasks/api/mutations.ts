import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { taskKeys } from "./queries";
import { challengeKeys } from "@/features/challenges/api/queries";
import type {
  TaskInsert,
  TaskUpdate,
  TaskWithAssignee,
} from "../types";

// ── Ensure daily habits (fire-and-forget on mount) ──

async function ensureDailyHabits(args: {
  memberId: string;
  familyId: string;
  tz: string;
}) {
  const { error } = await supabase.rpc("ensure_daily_habits", {
    p_member_id: args.memberId,
    p_family_id: args.familyId,
    p_tz: args.tz,
  });
  if (error) throw error;
}

export function useEnsureDailyHabits() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: ensureDailyHabits,
    onSuccess: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: taskKeys.all(member.family_id) });
    },
  });
}

// ── Claim daily chest reward ──

export type ClaimDailyChestResult = {
  coins_awarded: number;
};

async function claimDailyChest(args: {
  memberId: string;
  tz: string;
}): Promise<ClaimDailyChestResult> {
  const { data, error } = await supabase.rpc("claim_daily_chest", {
    p_member_id: args.memberId,
    p_tz: args.tz,
  });
  if (error) throw error;
  return data as ClaimDailyChestResult;
}

export function useClaimDailyChest() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: claimDailyChest,
    onSuccess: () => {
      if (!member?.id) return;
      qc.invalidateQueries({ queryKey: taskKeys.dailyChestClaimed(member.id) });
      qc.invalidateQueries({ queryKey: ["my-family"] });
    },
  });
}

// ── Create task ──

async function createTask(task: TaskInsert): Promise<TaskWithAssignee> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(task)
    .select(
      "*, assignee:family_members!tasks_assignee_id_fkey(id, nickname)",
    )
    .single();

  if (error) throw error;
  return data as unknown as TaskWithAssignee;
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      if (!member?.family_id) return;
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
        (old) => (old ? [...old, newTask] : [newTask]),
      );
    },
  });
}

// ── Complete task (atomic RPC) ──

type CompleteTaskInput = {
  task: TaskWithAssignee;
  memberId: string;
};

export type CompleteTaskResult = {
  points: number;
  coins: number;
  new_level: number | null;
  new_badges: string[];
};

async function completeTask({
  task,
  memberId,
}: CompleteTaskInput): Promise<CompleteTaskResult> {
  const { data, error } = await supabase.rpc("complete_task", {
    p_task_id: task.id,
    p_member_id: memberId,
  });
  if (error) throw error;
  const result = data as CompleteTaskResult;
  return {
    points: result.points,
    coins: result.coins,
    new_level: result.new_level ?? null,
    new_badges: result.new_badges ?? [],
  };
}

export function useCompleteTask() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: completeTask,
    onMutate: async ({ task }) => {
      if (!member?.family_id) return;
      await qc.cancelQueries({ queryKey: taskKeys.all(member.family_id) });
      const previous = qc.getQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
      );
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
        (old) => old?.filter((t) => t.id !== task.id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!member?.family_id || !context?.previous) return;
      qc.setQueryData(taskKeys.all(member.family_id), context.previous);
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: taskKeys.all(member.family_id) });
      qc.invalidateQueries({ queryKey: challengeKeys.all(member.family_id) });
    },
  });
}

// ── Update task ──

type UpdateTaskInput = {
  taskId: string;
  updates: TaskUpdate;
};

async function updateTask({
  taskId,
  updates,
}: UpdateTaskInput): Promise<TaskWithAssignee> {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select(
      "*, assignee:family_members!tasks_assignee_id_fkey(id, nickname)",
    )
    .single();

  if (error) throw error;
  return data as unknown as TaskWithAssignee;
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updated) => {
      if (!member?.family_id) return;
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
        (old) => old?.map((t) => (t.id === updated.id ? updated : t)) ?? [],
      );
      qc.setQueryData(taskKeys.detail(updated.id), updated);
    },
  });
}

// ── Dev: Reset today's completed tasks ──

async function devResetTodayTasks(memberId: string): Promise<number> {
  const { data, error } = await supabase.rpc("dev_reset_today_tasks", {
    p_member_id: memberId,
  });
  if (error) throw error;
  return data as number;
}

export function useDevResetTodayTasks() {
  return useMutation({
    mutationFn: devResetTodayTasks,
  });
}

// ── Delete task ──

async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      if (!member?.family_id) return;
      await qc.cancelQueries({ queryKey: taskKeys.all(member.family_id) });
      const previous = qc.getQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
      );
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(member.family_id),
        (old) => old?.filter((t) => t.id !== taskId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _taskId, context) => {
      if (!member?.family_id || !context?.previous) return;
      qc.setQueryData(taskKeys.all(member.family_id), context.previous);
    },
    onSettled: () => {
      if (!member?.family_id) return;
      qc.invalidateQueries({ queryKey: taskKeys.all(member.family_id) });
    },
  });
}
