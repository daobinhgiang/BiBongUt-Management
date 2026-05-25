import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

/**
 * Stack back control: chevron-only, full Pressable hit area (with
 * headerBackTitleVisible: false on screens so RN doesn’t add a dead label).
 */
export function TasksScreenHeaderBack() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/(app)/(tabs)");
      }}
      className="ml-1 min-h-[44px] flex-row items-center justify-center px-2 py-2"
    >
      <Ionicons name="chevron-back" size={28} color="#819067" />
    </Pressable>
  );
}
