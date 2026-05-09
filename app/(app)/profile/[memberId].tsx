import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { ProfileScreen } from "@/features/gamification/screens/ProfileScreen";

export default function MemberProfileRoute() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
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
                else router.replace("/(app)/(tabs)/me");
              }}
              className="ml-1 min-h-[44px] items-center justify-center px-2 py-2"
            >
              <Ionicons name="chevron-back" size={28} color="#819067" />
            </Pressable>
          ),
          headerTitle: "",
        }}
      />
      <ProfileScreen memberId={memberId} />
    </>
  );
}
