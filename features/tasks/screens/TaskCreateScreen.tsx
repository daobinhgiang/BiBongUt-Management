import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useCreateTask } from "../api/mutations";
import { TaskForm } from "../components/TaskForm";
import type { CreateTaskFormValues } from "../schemas";

export function TaskCreateScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const createTask = useCreateTask();

  const handleSubmit = (values: CreateTaskFormValues) => {
    if (!family) return;

    createTask.mutate(
      {
        title: values.title,
        description: values.description || null,
        assignee_id: values.assignee_id,
        difficulty: values.difficulty,
        points: values.points,
        coins_reward: values.coins_reward,
        due_date: values.due_date,
        recurrence: values.recurrence,
        family_id: family.family_id,
        created_by: family.id,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create task"),
      },
    );
  };

  return <TaskForm onSubmit={handleSubmit} isPending={createTask.isPending} familyId={family?.family_id} />;
}
