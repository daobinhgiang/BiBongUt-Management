import { Pressable, Text, View } from "react-native";
import { ArrowsClockwise, CalendarBlank, Lightning } from "phosphor-react-native";
import { DAY_LABELS, type ChoreChartWithSlots } from "../types";

type Props = {
  chart: ChoreChartWithSlots;
  onPress: () => void;
};

export function ChoreChartCard({ chart, onPress }: Props) {
  const isRotating = chart.schedule_type === "rotate_weekly";

  return (
    <Pressable
      className="rounded-2xl border border-bark-50 bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-gray-900">
            {chart.title}
          </Text>

          <View className="mt-1 flex-row items-center gap-2">
            {isRotating ? (
              <View className="flex-row items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5">
                <ArrowsClockwise size={12} color="#7e22ce" />
                <Text className="text-xs font-medium text-purple-700">
                  Rotates weekly
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1">
                <CalendarBlank size={12} color="#6b7280" />
                <Text className="text-xs text-gray-500">
                  {chart.chore_chart_slots
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((s) => DAY_LABELS[s.day_of_week])
                    .join(", ")}
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-0.5">
              <Lightning size={12} color="#819067" weight="fill" />
              <Text className="text-xs font-medium text-jungle-600">
                {chart.points} XP
              </Text>
            </View>
          </View>

          {/* Assignees */}
          <View className="mt-1 flex-row flex-wrap gap-1">
            {isRotating
              ? null // rotation members shown in detail
              : chart.chore_chart_slots
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((slot) => (
                    <Text key={slot.id} className="text-xs text-gray-400">
                      {DAY_LABELS[slot.day_of_week]}: {slot.assignee.nickname}
                    </Text>
                  ))}
          </View>
        </View>

        {/* Difficulty */}
        <View
          className={`rounded-full px-2 py-0.5 ${
            chart.difficulty === "hard"
              ? "bg-red-100"
              : chart.difficulty === "medium"
                ? "bg-amber-100"
                : "bg-green-100"
          }`}
        >
          <Text
            className={`text-xs font-medium capitalize ${
              chart.difficulty === "hard"
                ? "text-red-700"
                : chart.difficulty === "medium"
                  ? "text-amber-700"
                  : "text-green-700"
            }`}
          >
            {chart.difficulty}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
