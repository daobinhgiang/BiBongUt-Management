import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { useCreateTask } from "../api/mutations";
import { useUpsertActivity } from "../api/activity-mutations";
import { TaskForm } from "../components/TaskForm";
import { localTimezone } from "../types";
import type { CreateTaskFormValues } from "../schemas";

export function TaskCreateScreen() {
  const router = useRouter();
  const { data: member } = useCurrentMember();
  const createTask = useCreateTask();
  const upsertActivity = useUpsertActivity();

  const handleSubmit = (values: CreateTaskFormValues) => {
    if (!member) return;

    createTask.mutate(
      {
        title: values.title,
        description: values.description || null,
        assignee_id: values.assignee_id,
        difficulty: "easy",
        points: 0,
        coins_reward: values.coins_reward,
        due_date: values.due_date,
        recurrence: values.recurrence,
        creator_tz: localTimezone(),
        family_id: member.family_id,
        created_by: member.id,
      },
      {
        onSuccess: () => {
          upsertActivity.mutate({
            family_id: member.family_id,
            name: values.title,
          });
          router.back();
        },
        onError: (err) =>
          Alert.alert("Error", err.message ?? "Could not create task"),
      },
    );
  };

  return <TaskForm onSubmit={handleSubmit} isPending={createTask.isPending} familyId={member?.family_id} />;
}
