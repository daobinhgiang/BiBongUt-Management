import { Alert, Platform, Pressable, Switch, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Bell,
  ArrowRight,
  Code,
  SignOut,
} from "phosphor-react-native";

import { useSession } from "@/lib/auth/ctx";
import { useDevMode, useDevModeStore } from "@/lib/stores/developer-mode";

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const devMode = useDevMode();
  const toggleDevMode = useDevModeStore((s) => s.toggle);

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        signOut();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => signOut(),
        },
      ]);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
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
        }}
      />
      <View className="flex-1 bg-bark-50 px-4 pt-4">
        {/* Notifications */}
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm"
          onPress={() => router.push("/(app)/settings/notifications")}
        >
          <View className="flex-row items-center gap-3">
            <Bell size={22} color="#819067" weight="fill" />
            <Text className="text-base font-medium text-gray-900">
              Notifications
            </Text>
          </View>
          <ArrowRight size={20} color="#9ca3af" />
        </Pressable>

        {/* Developer Mode */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Code size={22} color="#819067" weight="fill" />
            <Text className="text-base font-medium text-gray-900">
              Developer Mode
            </Text>
          </View>
          <Switch
            value={devMode}
            onValueChange={toggleDevMode}
            trackColor={{ false: "#d1d5db", true: "#819067" }}
            thumbColor="#fff"
          />
        </View>

        {/* Sign Out */}
        <Pressable
          accessibilityRole="button"
          className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-white p-4 shadow-sm"
          onPress={handleSignOut}
        >
          <SignOut size={22} color="#ef4444" weight="bold" />
          <Text className="text-base font-semibold text-red-500">
            Sign Out
          </Text>
        </Pressable>
      </View>
    </>
  );
}
