import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { taskKeys } from "./queries";
import { challengeKeys } from "@/features/challenges/api/queries";
import type {
  TaskInsert,
  TaskUpdate,
  TaskWithAssignee,
} from "../types";

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
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      if (!family?.family_id) return;
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
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
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: completeTask,
    onMutate: async ({ task }) => {
      if (!family?.family_id) return;
      await qc.cancelQueries({ queryKey: taskKeys.all(family.family_id) });
      const previous = qc.getQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
      );
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
        (old) => old?.filter((t) => t.id !== task.id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!family?.family_id || !context?.previous) return;
      qc.setQueryData(taskKeys.all(family.family_id), context.previous);
    },
    onSettled: () => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: taskKeys.all(family.family_id) });
      qc.invalidateQueries({ queryKey: challengeKeys.all(family.family_id) });
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
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updated) => {
      if (!family?.family_id) return;
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
        (old) => old?.map((t) => (t.id === updated.id ? updated : t)) ?? [],
      );
      qc.setQueryData(taskKeys.detail(updated.id), updated);
    },
  });
}

// ── Delete task ──

async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId) => {
      if (!family?.family_id) return;
      await qc.cancelQueries({ queryKey: taskKeys.all(family.family_id) });
      const previous = qc.getQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
      );
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(family.family_id),
        (old) => old?.filter((t) => t.id !== taskId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _taskId, context) => {
      if (!family?.family_id || !context?.previous) return;
      qc.setQueryData(taskKeys.all(family.family_id), context.previous);
    },
    onSettled: () => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: taskKeys.all(family.family_id) });
    },
  });
}
