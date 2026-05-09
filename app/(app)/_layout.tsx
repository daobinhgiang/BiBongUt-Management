import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";

export default function AppLayout() {
  const { data: familyMember, isLoading } = useFamily();
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
