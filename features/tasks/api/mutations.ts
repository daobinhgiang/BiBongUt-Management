import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { taskKeys } from "./queries";
import type { TaskInsert, TaskWithAssignee } from "../types";

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

export function useCreateTask(familyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      qc.setQueryData<TaskWithAssignee[]>(
        taskKeys.all(familyId),
        (old) => (old ? [...old, newTask] : [newTask]),
      );
    },
  });
}
