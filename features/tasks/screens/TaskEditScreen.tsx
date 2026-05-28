import { ActivityIndicator, Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useTask } from "../api/queries";
import { useUpdateTask } from "../api/mutations";
import { TaskForm } from "../components/TaskForm";
import { localTimezone } from "../types";
import type { CreateTaskFormValues } from "../schemas";

export function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();

  if (isLoading || !task) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleSubmit = (values: CreateTaskFormValues) => {
    updateTask.mutate(
      {
        taskId: task.id,
        updates: {
          title: values.title,
          description: values.description || null,
          assignee_id: values.assignee_id,
          difficulty: values.difficulty,
          points: values.points,
          coins_reward: values.coins_reward,
          due_date: values.due_date,
          recurrence: values.recurrence,
          creator_tz: localTimezone(),
        },
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not update task"),
      },
    );
  };

  return (
    <TaskForm
      onSubmit={handleSubmit}
      isPending={updateTask.isPending}
      familyId={task.family_id}
      initialValues={{
        title: task.title,
        description: task.description ?? "",
        assignee_id: task.assignee_id,
        difficulty: task.difficulty,
        points: task.points,
        coins_reward: task.coins_reward,
        due_date: task.due_date,
        recurrence: task.recurrence,
      }}
      submitLabel="Save Changes"
      pendingLabel="Saving..."
    />
  );
}
