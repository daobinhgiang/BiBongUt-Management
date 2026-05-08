import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";

export default function AppLayout() {
  const { data: familyMember, isLoading } = useFamily();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const inTabs = segments.includes("(tabs)" as never);

    if (!familyMember && inTabs) {
      router.replace("/(app)/family-setup");
    } else if (familyMember && !inTabs) {
      router.replace("/(app)/(tabs)");
    }

    hasNavigated.current = true;
  }, [familyMember, isLoading]);

  if (isLoading || !hasNavigated.current) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
