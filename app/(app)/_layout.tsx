import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";

export default function AppLayout() {
  const { data: familyMember, isLoading } = useFamily();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!familyMember) {
      router.replace("/(app)/family-setup");
    } else {
      router.replace("/(app)/(tabs)");
    }
  }, [familyMember, isLoading, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
