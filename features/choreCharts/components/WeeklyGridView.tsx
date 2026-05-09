import { Text, View } from "react-native";
import { ArrowsClockwise } from "phosphor-react-native";
import { DAY_LABELS, type ChoreChartWithSlots } from "../types";

type Props = {
  chart: ChoreChartWithSlots;
  /** For rotation charts: show who's assigned this week */
  currentRotationMember?: { id: string; nickname: string } | null;
};

export function WeeklyGridView({ chart, currentRotationMember }: Props) {
  const isRotating = chart.schedule_type === "rotate_weekly";
  const slotsByDay = new Map(
    chart.chore_chart_slots.map((s) => [s.day_of_week, s]),
  );

  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-sm font-semibold text-gray-700">
        Weekly Schedule
      </Text>

      {isRotating ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-2 rounded-xl bg-purple-50 p-3">
            <ArrowsClockwise size={18} color="#7e22ce" />
            <View>
              <Text className="text-sm font-medium text-purple-800">
                Rotates weekly
              </Text>
              {currentRotationMember && (
                <Text className="text-xs text-purple-600">
                  This week: {currentRotationMember.nickname}
                </Text>
              )}
            </View>
          </View>
          <Text className="text-xs text-gray-400">
            One task per week, assigned to whoever's turn it is
          </Text>
        </View>
      ) : (
        <View className="flex-row gap-1">
          {DAY_LABELS.map((label, dayIndex) => {
            const slot = slotsByDay.get(dayIndex);
            return (
              <View
                key={dayIndex}
                className={`flex-1 items-center rounded-lg py-2 ${
                  slot ? "bg-jungle-50" : "bg-bark-50"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    slot ? "text-jungle-700" : "text-gray-400"
                  }`}
                >
                  {label}
                </Text>
                {slot && (
                  <Text
                    className="mt-0.5 text-[10px] text-jungle-600"
                    numberOfLines={1}
                  >
                    {slot.assignee.nickname}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
