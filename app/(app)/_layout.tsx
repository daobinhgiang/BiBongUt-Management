import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { usePushNotifications } from "@/features/notifications";

export default function AppLayout() {
  // Family data is prefetched in AuthGate — resolves from cache on first render
  const { data: familyMember, isLoading, error } = useCurrentMember();

  // Register push token + handle notification taps (non-blocking)
  usePushNotifications();
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (isLoading) return;

    const inTabs = segmentsRef.current.some((s) => s === "(tabs)");

    if (!familyMember && inTabs) {
      router.replace("/(app)/family-setup");
    } else if (familyMember && !inTabs) {
      router.replace("/(app)/(tabs)");
    }
  }, [familyMember, isLoading, router]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="mb-2 text-lg font-semibold text-red-600">
          Something went wrong
        </Text>
        <Text className="text-center text-sm text-gray-500">
          {error.message}
        </Text>
      </View>
    );
  }

  // Splash screen covers this while loading — no spinner needed
  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f5f2ea" },
      }}
    />
  );
}
