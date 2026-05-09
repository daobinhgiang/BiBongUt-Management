import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { taskKeys } from "./queries";
import type {
  TaskInsert,
  TaskRecurrence,
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

// ── Complete task ──

type CompleteTaskInput = {
  task: TaskWithAssignee;
  memberId: string;
};

function getNextDueDate(
  currentDue: string | null,
  recurrence: TaskRecurrence,
): string | null {
  if (recurrence === "none" || !currentDue) return null;
  const d = new Date(currentDue);
  switch (recurrence) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}

async function completeTask({ task, memberId }: CompleteTaskInput) {
  const { error: completionError } = await supabase
    .from("task_completions")
    .insert({
      task_id: task.id,
      completed_by: memberId,
      points_awarded: task.points,
      coins_awarded: task.coins_reward,
    });
  if (completionError) throw completionError;

  const { error: awardError } = await supabase.rpc("award_points", {
    p_member_id: memberId,
    p_xp: task.points,
    p_coins: task.coins_reward,
    p_reason: `Completed task: ${task.title}`,
    p_ref_table: "tasks",
    p_ref_id: task.id,
  });
  if (awardError) throw awardError;

  const { error: deactivateError } = await supabase
    .from("tasks")
    .update({ is_active: false })
    .eq("id", task.id);
  if (deactivateError) throw deactivateError;

  if (task.recurrence !== "none") {
    const nextDue = getNextDueDate(task.due_date, task.recurrence);
    const { error: nextError } = await supabase.from("tasks").insert({
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      difficulty: task.difficulty,
      points: task.points,
      coins_reward: task.coins_reward,
      due_date: nextDue,
      recurrence: task.recurrence,
      family_id: task.family_id,
      created_by: task.created_by,
    });
    if (nextError) throw nextError;
  }

  return { points: task.points, coins: task.coins_reward };
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
