import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight } from "phosphor-react-native";

import { useMonthEvents } from "../api/queries";
import { useChoreCharts } from "@/features/choreCharts";
import { MonthGrid } from "../components/MonthGrid";
import { EventCard } from "../components/EventCard";
import type { EventWithAttendees } from "../types";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1 + delta;
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const d = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Convert JS getDay() (0=Sun) to chore chart day_of_week (0=Mon). */
function jsDayToChoreDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function CalendarScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const { data: events = [], isLoading } = useMonthEvents(selectedMonth);
  const { data: charts } = useChoreCharts();

  const dayEvents = selectedDate
    ? events.filter((e) => {
        const eDate = new Date(e.start_at);
        const eStr = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, "0")}-${String(eDate.getDate()).padStart(2, "0")}`;
        return eStr === selectedDate;
      })
    : [];

  // Inject chore chart slots as calendar events for the selected day
  if (selectedDate && charts) {
    const selectedDow = jsDayToChoreDay(new Date(selectedDate + "T12:00:00").getDay());
    for (const chart of charts) {
      if (chart.schedule_type === "rotate_weekly") continue;
      const slot = chart.chore_chart_slots.find((s) => s.day_of_week === selectedDow);
      if (slot) {
        dayEvents.push({
          id: `chore-${chart.id}-${selectedDate}`,
          title: chart.title,
          description: chart.description,
          start_at: `${selectedDate}T20:30:00`,
          end_at: `${selectedDate}T21:00:00`,
          all_day: false,
          family_id: chart.family_id,
          created_by: chart.created_by,
          created_at: chart.created_at,
          creator: { id: "", nickname: "" },
          event_attendees: [
            {
              id: `chore-attendee-${slot.id}`,
              event_id: `chore-${chart.id}-${selectedDate}`,
              family_member_id: slot.assignee_id,
              status: "going" as const,
              family_member: slot.assignee,
            },
          ],
        } as EventWithAttendees);
      }
    }
    dayEvents.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
  }

  return (
    <View className="flex-1 bg-bark-50">
      {/* Month header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          hitSlop={12}
          onPress={() => setSelectedMonth((m) => shiftMonth(m, -1))}
        >
          <CaretLeft size={24} color="#819067" weight="bold" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">
          {monthLabel(selectedMonth)}
        </Text>
        <Pressable
          hitSlop={12}
          onPress={() => setSelectedMonth((m) => shiftMonth(m, 1))}
        >
          <CaretRight size={24} color="#819067" weight="bold" />
        </Pressable>
      </View>

      {/* Grid */}
      <View className="px-4">
        <MonthGrid
          month={selectedMonth}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          hasChoreCharts={!!charts && charts.length > 0}
        />
      </View>

      {/* Day events */}
      {isLoading ? (
        <View className="mt-6 items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList<EventWithAttendees>
          data={dayEvents}
          keyExtractor={(e) => e.id}
          contentContainerClassName="px-4 pt-4 pb-6 gap-2"
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={
                item.id.startsWith("chore-")
                  ? undefined
                  : () => router.push(`/(app)/calendar/${item.id}`)
              }
            />
          )}
          ListEmptyComponent={
            selectedDate ? (
              <Text className="mt-4 text-center text-sm text-gray-400">
                No events on this day
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
