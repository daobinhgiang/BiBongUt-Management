/**
 * Tab Navigator Layout
 *
 * Defines the 5 main tabs of the app with an animated custom tab bar.
 *
 * | Tab        | Screen         | Content                                              |
 * |------------|----------------|------------------------------------------------------|
 * | Do         | index.tsx      | Tasks + Challenges                                   |
 * | Challenges | challenges.tsx | Boss battles                                         |
 * | Plan       | plan.tsx       | Calendar + Meal Planning                             |
 * | Lists      | lists.tsx      | Shopping + Pantry + Bucket List + Movies              |
 * | Me         | me.tsx         | Profile, level, badges, streaks, rewards, leaderboard|
 *
 * @see https://docs.expo.dev/router/advanced/tabs/
 */
import { View } from "react-native";
import { Tabs, usePathname } from "expo-router";
import {
  House,
  Sword,
  CalendarBlank,
  ListBullets,
  UserCircle,
} from "phosphor-react-native";

import { StatsHeader } from "@/components/StatsHeader";
import { AnimatedTabBar } from "@/components/AnimatedTabBar";

export default function TabLayout() {
  const pathname = usePathname();
  const isProfileTab = pathname === "/me";

  return (
    <View className="flex-1 bg-bark-50">
      {!isProfileTab && <StatsHeader />}
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: "#819067",
          headerShown: false,
          animation: "none",
          freezeOnBlur: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <House size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="challenges"
          options={{
            title: "Challenges",
            tabBarIcon: ({ color, size }) => (
              <Sword size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: "Plan",
            tabBarIcon: ({ color, size }) => (
              <CalendarBlank size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            title: "Lists",
            tabBarIcon: ({ color, size }) => (
              <ListBullets size={size} color={color} weight="fill" />
            ),
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: "Me",
            tabBarIcon: ({ color, size }) => (
              <UserCircle size={size} color={color} weight="fill" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
