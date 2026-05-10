import { Pressable, Text, View } from "react-native";
import type { EventWithAttendees } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  month: string; // "YYYY-MM"
  events: EventWithAttendees[];
  selectedDate: string | null; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
  hasChoreCharts?: boolean;
};

export function MonthGrid({ month, events, selectedDate, onSelectDate, hasChoreCharts }: Props) {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7)) - 1;
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();
  const todayStr =
    today.getFullYear() === year && today.getMonth() === mon
      ? String(today.getDate())
      : null;

  // Build set of days that have events
  const eventDays = new Set<number>();
  for (const ev of events) {
    const d = new Date(ev.start_at).getDate();
    eventDays.add(d);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View>
      {/* Weekday header */}
      <View className="mb-1 flex-row">
        {WEEKDAYS.map((wd) => (
          <View key={wd} className="flex-1 items-center py-1">
            <Text className="text-xs font-medium text-gray-400">{wd}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, i) => {
          if (day === null) {
            return <View key={`empty-${i}`} className="h-10" style={{ width: "14.28%" }} />;
          }

          const dateStr = `${month}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = String(day) === todayStr;
          const hasEvents = eventDays.has(day) || !!hasChoreCharts;

          return (
            <Pressable
              key={day}
              className={`h-10 items-center justify-center ${
                isSelected
                  ? "rounded-lg border border-jungle-500 bg-jungle-100"
                  : ""
              }`}
              style={{ width: "14.28%" }}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text
                className={`text-sm ${
                  isSelected
                    ? "font-bold text-jungle-700"
                    : isToday
                      ? "font-bold text-gray-900"
                      : "text-gray-700"
                }`}
              >
                {day}
              </Text>
              {hasEvents && (
                <View className="mt-0.5 h-1 w-1 rounded-full bg-jungle-500" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
