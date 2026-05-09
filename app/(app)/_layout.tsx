import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { usePushNotifications } from "@/features/notifications";

export default function AppLayout() {
  const { data: familyMember, isLoading, error } = useFamily();

  // Register push token + handle notification taps
  usePushNotifications();
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inTabs = segmentsRef.current.some((s) => s === "(tabs)");

    if (!familyMember && inTabs) {
      router.replace("/(app)/family-setup");
    } else if (familyMember && !inTabs) {
      router.replace("/(app)/(tabs)");
    }

    setReady(true);
  }, [familyMember, isLoading, router]);

  if (isLoading || !ready) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

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

  return <Stack screenOptions={{ headerShown: false }} />;
}
