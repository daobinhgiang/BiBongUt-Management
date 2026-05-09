/**
 * Plan Tab — Chore Charts + Calendar + Meal Planning
 */
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarDots,
  ForkKnife,
  Rows,
} from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useChoreCharts } from "@/features/choreCharts";
import { ChoreChartCard } from "@/features/choreCharts/components/ChoreChartCard";
import { PlusIcon } from "phosphor-react-native";

export default function PlanScreen() {
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: charts } = useChoreCharts();
  const isMember = family != null;

  return (
    <View className="flex-1 bg-bark-50 px-4 pt-6">
      <Text className="mb-4 text-2xl font-bold text-gray-900">Plan</Text>

      {/* Chore Charts Section */}
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Rows size={18} color="#819067" weight="duotone" />
            <Text className="text-base font-semibold text-gray-800">Chore Charts</Text>
          </View>
          <Pressable onPress={() => router.push("/(app)/chore-charts")}>
            <Text className="text-sm font-medium text-jungle-600">See all</Text>
          </Pressable>
        </View>

        {!charts || charts.length === 0 ? (
          <Pressable
            className="items-center rounded-2xl border-2 border-dashed border-bark-300 bg-white py-8"
            onPress={() => {
              if (isMember) router.push("/(app)/chore-charts/new");
              else router.push("/(app)/chore-charts");
            }}
          >
            <Rows size={32} color="#9ca3af" weight="duotone" />
            <Text className="mt-2 text-sm text-gray-500">
              {isMember ? "Set up a weekly chore schedule" : "No chores scheduled"}
            </Text>
          </Pressable>
        ) : (
          <View className="gap-2">
            {charts.slice(0, 3).map((chart) => (
              <ChoreChartCard
                key={chart.id}
                chart={chart}
                onPress={() => router.push(`/(app)/chore-charts/${chart.id}`)}
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

      {/* Coming soon sections */}
      <View className="gap-3">
        <Pressable
          className="flex-row items-center gap-4 rounded-2xl bg-white p-4 opacity-50 shadow-sm"
          disabled
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-bark-50">
            <CalendarDots size={28} color="#6b7280" weight="duotone" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Calendar</Text>
            <Text className="text-sm text-gray-500">Family events & schedule</Text>
          </View>
          <Text className="text-xs text-gray-400">Soon</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-4 rounded-2xl bg-white p-4 opacity-50 shadow-sm"
          disabled
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-bark-50">
            <ForkKnife size={28} color="#6b7280" weight="duotone" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Meal Planning</Text>
            <Text className="text-sm text-gray-500">Weekly meals & shopping</Text>
          </View>
          <Text className="text-xs text-gray-400">Soon</Text>
        </Pressable>
      </View>

      {/* FAB for parents */}
      {isMember && (
        <Pressable
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-jungle-500 shadow-lg"
          onPress={() => router.push("/(app)/chore-charts/new")}
        >
          <PlusIcon size={28} color="#fff" weight="bold" />
        </Pressable>
      )}
    </View>
  );
}
