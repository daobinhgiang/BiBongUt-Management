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
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import {
  House,
  Sword,
  CalendarBlank,
  ListBullets,
  UserCircle,
} from "phosphor-react-native";

import { useDevMode } from "@/lib/stores/developer-mode";
import { AnimatedTabBar } from "@/components/AnimatedTabBar";

const BARK_50 = "#f5f2ea";

export default function TabLayout() {
  const devMode = useDevMode();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: BARK_50 }}
      edges={["top"]}
    >
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: "#819067",
          headerShown: false,
          animation: "none",
          freezeOnBlur: true,
          sceneStyle: { backgroundColor: BARK_50 },
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
            href: devMode ? undefined : null,
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
            href: devMode ? undefined : null,
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
    </SafeAreaView>
  );
}
