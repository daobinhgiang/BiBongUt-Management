import { Stack } from "expo-router";
import { TaskCreateScreen } from "@/features/tasks/screens/TaskCreateScreen";

export default function NewTaskRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "New Task" }} />
      <TaskCreateScreen />
    </>
  );
}
