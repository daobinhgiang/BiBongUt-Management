import { Stack } from "expo-router";
import { TaskDetailScreen } from "@/features/tasks/screens/TaskDetailScreen";

export default function TaskDetailRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Task" }} />
      <TaskDetailScreen />
    </>
  );
}
