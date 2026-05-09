import { Stack } from "expo-router";
import { TaskListScreen } from "@/features/tasks/screens/TaskListScreen";

export default function TasksRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Tasks" }} />
      <TaskListScreen />
    </>
  );
}
