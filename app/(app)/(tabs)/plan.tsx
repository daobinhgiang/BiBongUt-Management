/**
 * Plan Tab — Calendar as main view, with Chore Charts & Meal Planning as floating sub-tabs
 */
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Rows, ForkKnife, PlusIcon } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { CalendarScreen } from "@/features/calendar/screens/CalendarScreen";
import { useChoreCharts } from "@/features/choreCharts";
import { ChoreChartCard } from "@/features/choreCharts/components/ChoreChartCard";

type SubTab = "chores" | "meals" | null;

export default function PlanScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: charts } = useChoreCharts();
  const isMember = family != null;
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(null);

  const toggleSubTab = (tab: SubTab) =>
    setActiveSubTab((prev) => (prev === tab ? null : tab));

  return (
    <View className="flex-1 bg-bark-50">
      {/* Calendar fills the screen */}
      <CalendarScreen />

      {/* Floating sub-tab pills */}
      <View className="absolute bottom-20 left-4 right-4">
        {/* Expanded panel */}
        {activeSubTab === "chores" && (
          <View className="mb-2 rounded-2xl bg-white p-4 shadow-lg">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-semibold text-gray-800">
                Chore Charts
              </Text>
              <Pressable onPress={() => router.push("/(app)/chore-charts")}>
                <Text className="text-sm font-medium text-jungle-600">
                  See all
                </Text>
              </Pressable>
            </View>
            {!charts || charts.length === 0 ? (
              <Pressable
                className="items-center rounded-xl border-2 border-dashed border-bark-300 py-6"
                onPress={() => {
                  if (isMember) router.push("/(app)/chore-charts/new");
                  else router.push("/(app)/chore-charts");
                }}
              >
                <Rows size={28} color="#9ca3af" weight="duotone" />
                <Text className="mt-1 text-sm text-gray-500">
                  {isMember
                    ? "Set up a weekly chore schedule"
                    : "No chores scheduled"}
                </Text>
              </Pressable>
            ) : (
              <View className="gap-2">
                {charts.slice(0, 3).map((chart) => (
                  <ChoreChartCard
                    key={chart.id}
                    chart={chart}
                    onPress={() =>
                      router.push(`/(app)/chore-charts/${chart.id}`)
                    }
                  />
                ))}
                {charts.length > 3 && (
                  <Pressable onPress={() => router.push("/(app)/chore-charts")}>
                    <Text className="text-center text-sm text-jungle-600">
                      +{charts.length - 3} more
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {activeSubTab === "meals" && (
          <View className="mb-2 rounded-2xl bg-white p-4 shadow-lg">
            <Text className="text-base font-semibold text-gray-800">
              Meal Planning
            </Text>
            <Text className="mt-1 text-sm text-gray-400">Coming soon</Text>
          </View>
        )}

        {/* Pill buttons */}
        <View className="flex-row justify-center gap-2">
          <Pressable
            className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 shadow-md ${
              activeSubTab === "chores"
                ? "bg-jungle-500"
                : "bg-white"
            }`}
            onPress={() => toggleSubTab("chores")}
          >
            <Rows
              size={16}
              color={activeSubTab === "chores" ? "#fff" : "#819067"}
              weight="duotone"
            />
            <Text
              className={`text-sm font-medium ${
                activeSubTab === "chores"
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              Chores
            </Text>
          </Pressable>

          <Pressable
            className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 shadow-md ${
              activeSubTab === "meals"
                ? "bg-jungle-500"
                : "bg-white"
            }`}
            onPress={() => toggleSubTab("meals")}
          >
            <ForkKnife
              size={16}
              color={activeSubTab === "meals" ? "#fff" : "#6b7280"}
              weight="duotone"
            />
            <Text
              className={`text-sm font-medium ${
                activeSubTab === "meals"
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              Meals
            </Text>
          </Pressable>
        </View>
      </View>

      {/* FAB — matches other tabs */}
      {isMember && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/calendar/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
