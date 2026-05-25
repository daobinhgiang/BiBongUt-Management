import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth/ctx";
import { useFamily } from "@/features/auth/hooks/useFamily";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log("[push] Must use physical device for push notifications");
    return null;
  }

  // Web is not supported
  if (Platform.OS === "web") return null;

  // Set up Android notification channels
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Check/request permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Permission not granted");
    return null;
  }

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return token;
}

/**
 * Hook to register push notifications and handle deep linking from taps.
 * Call this once in a component that's mounted after auth (e.g., app layout).
 */
export function usePushNotifications() {
  const { session } = useSession();
  const { data: family } = useFamily();
  const router = useRouter();
  const notificationResponseRef = useRef<Notifications.Subscription>(null);

  // Register token on login
  useEffect(() => {
    if (!session || !family?.id) return;

    registerForPushNotifications().then(async (token) => {
      if (!token) return;
      if (__DEV__) console.log("[push] Token:", token);

      // Save token to family_members
      const { error } = await supabase
        .from("family_members")
        .update({ push_token: token })
        .eq("id", family.id);

      if (error) console.error("[push] Failed to save token:", error);
    });
  }, [session, family?.id]);

  // Handle notification taps → deep link
  useEffect(() => {
    notificationResponseRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          screen?: string;
          taskId?: string;
          memberId?: string;
          challengeId?: string;
        };

        if (!data?.screen) return;

        switch (data.screen) {
          case "task":
            if (data.taskId) router.push(`/(app)/tasks/${data.taskId}`);
            break;
          case "tasks":
            router.push("/(app)/(tabs)");
            break;
          case "profile":
            if (data.memberId)
              router.push(`/(app)/profile/${data.memberId}`);
            else router.push("/(app)/(tabs)/me");
            break;
          case "leaderboard":
            router.push("/(app)/leaderboard");
            break;
          case "challenge":
            if (data.challengeId)
              router.push(`/(app)/challenges/${data.challengeId}`);
            else router.push("/(app)/challenges");
            break;
          case "rewards":
            router.push("/(app)/rewards");
            break;
        }
      });

    return () => {
      notificationResponseRef.current?.remove();
    };
  }, [router]);
}
