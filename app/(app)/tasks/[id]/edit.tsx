import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { TaskEditScreen } from "@/features/tasks/screens/TaskEditScreen";

export default function EditTaskRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Task",
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "#2563eb",
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(app)/(tabs)/do");
              }}
              className="ml-1 flex-row items-center justify-center p-1"
            >
              <Ionicons name="chevron-back" size={28} color="#2563eb" />
            </Pressable>
          ),
        }}
      />
      <TaskEditScreen />
    </>
  );
}
