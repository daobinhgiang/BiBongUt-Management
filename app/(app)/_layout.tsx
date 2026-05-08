import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";

export default function AppLayout() {
  const { data: familyMember, isLoading } = useFamily();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!familyMember) {
      router.replace("/(app)/family-setup");
    } else {
      router.replace("/(app)/(tabs)");
    }
    // Delay one frame so router.replace processes before Stack renders
    requestAnimationFrame(() => setReady(true));
  }, [familyMember, isLoading]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
