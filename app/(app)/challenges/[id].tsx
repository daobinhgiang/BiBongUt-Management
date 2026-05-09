import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { ChallengeDetailScreen } from "@/features/challenges";

export default function ChallengeDetailRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Challenge",
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "#819067",
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/(app)/challenges");
              }}
              className="ml-1 flex-row items-center p-1"
            >
              <Ionicons name="chevron-back" size={28} color="#819067" />
              <Text className="text-base font-normal text-jungle-600">
                Back
              </Text>
            </Pressable>
          ),
          headerTitle: "",
        }}
      />
      <ChallengeDetailScreen />
    </>
  );
}
