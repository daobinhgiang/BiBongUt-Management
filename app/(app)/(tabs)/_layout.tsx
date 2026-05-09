/**
 * Tab Navigator Layout
 *
 * Defines the 5 main tabs of the app:
 *
 * | Tab   | Screen     | Content                                              |
 * |-------|------------|------------------------------------------------------|
 * | Home  | index.tsx  | Dashboard: active votes, daily quests, announcements  |
 * | Do    | do.tsx     | Tasks + Challenges                                   |
 * | Plan  | plan.tsx   | Calendar + Meal Planning                             |
 * | Lists | lists.tsx  | Shopping + Pantry + Bucket List + Movies              |
 * | Me    | me.tsx     | Profile, level, badges, streaks, rewards, leaderboard|
 *
 * Icons use phosphor-react-native. Tab bar styling will be
 * customized with NativeWind once the design system is established.
 *
 * @see https://docs.expo.dev/router/advanced/tabs/
 */
import { Tabs } from "expo-router";
import {
  House,
  CheckCircle,
  CalendarBlank,
  ListBullets,
  UserCircle,
} from "phosphor-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="do"
        options={{
          title: "Do",
          tabBarIcon: ({ color, size }) => (
            <CheckCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, size }) => (
            <CalendarBlank size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color, size }) => (
            <ListBullets size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
