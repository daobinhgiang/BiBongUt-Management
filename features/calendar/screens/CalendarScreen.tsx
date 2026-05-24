import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CaretLeft, CaretRight, CaretDown } from "phosphor-react-native";

import { useMonthEvents } from "../api/queries";
import { useChoreCharts } from "@/features/choreCharts";
import { useFamilyMembers } from "@/features/families";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { MonthGrid } from "../components/MonthGrid";
import { EventCard } from "../components/EventCard";
import type { EventWithAttendees } from "../types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function getISOWeekForDate(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function MonthYearPicker({
  visible,
  selectedMonth,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedMonth: string;
  onSelect: (month: string) => void;
  onClose: () => void;
}) {
  const currentYear = Number(selectedMonth.slice(0, 4));
  const currentMon = Number(selectedMonth.slice(5, 7)) - 1;
  const [pickerYear, setPickerYear] = useState(currentYear);

  useEffect(() => {
    if (visible) setPickerYear(currentYear);
  }, [visible, currentYear]);

  const handleSelect = useCallback(
    (monIdx: number) => {
      const val = `${pickerYear}-${String(monIdx + 1).padStart(2, "0")}`;
      onSelect(val);
      onClose();
    },
    [pickerYear, onSelect, onClose],
  );

  const nowYear = new Date().getFullYear();
  const yearRange: number[] = [];
  for (let y = nowYear - 3; y <= nowYear + 3; y++) yearRange.push(y);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onPress={onClose}
      >
        <Pressable
          className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl bg-white"
          onPress={() => {}}
        >
          {/* Year selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 6 }}
          >
            {yearRange.map((y) => (
              <Pressable
                key={y}
                onPress={() => setPickerYear(y)}
                className="items-center justify-center rounded-full px-4"
                style={{
                  height: 36,
                  backgroundColor:
                    y === pickerYear ? "#819067" : "rgba(154, 168, 126, 0.12)",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: y === pickerYear ? "700" : "500",
                    color: y === pickerYear ? "#fff" : "#566341",
                  }}
                >
                  {y}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Month grid */}
          <View className="flex-row flex-wrap px-4 pb-4">
            {MONTHS.map((name, idx) => {
              const isSelected = pickerYear === currentYear && idx === currentMon;
              return (
                <Pressable
                  key={name}
                  onPress={() => handleSelect(idx)}
                  className="items-center justify-center"
                  style={{
                    width: "33.33%",
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: isSelected
                      ? "rgba(154, 168, 126, 0.18)"
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? "700" : "400",
                      color: isSelected ? "#566341" : "#374151",
                    }}
                  >
                    {name.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function CalendarScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [pickerVisible, setPickerVisible] = useState(false);
  const { data: events = [], isLoading } = useMonthEvents(selectedMonth);
  const { data: charts } = useChoreCharts();
  const { data: family } = useFamily();
  const { data: members } = useFamilyMembers(family?.family_id);

  const dayEvents = selectedDate
    ? events.filter((e) => {
        const eDate = new Date(e.start_at);
        const eStr = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, "0")}-${String(eDate.getDate()).padStart(2, "0")}`;
        return eStr === selectedDate;
      })
    : [];

  // Inject chore chart slots as calendar events for the selected day
  if (selectedDate && charts) {
    const buildChoreEvent = (
      chart: (typeof charts)[number],
      attendees: EventWithAttendees["event_attendees"],
    ): EventWithAttendees => ({
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
      event_attendees: attendees,
    } as EventWithAttendees);

    const selectedDow = jsDayToChoreDay(new Date(selectedDate + "T12:00:00").getDay());
    for (const chart of charts) {
      if (chart.schedule_type === "rotate_weekly") {
        const isoWeek = getISOWeekForDate(new Date(selectedDate + "T12:00:00"));
        const len = chart.rotation_members.length;
        const assigneeId = len > 0 ? chart.rotation_members[isoWeek % len] : null;
        const assignee = assigneeId && members
          ? members.find((m) => m.id === assigneeId)
          : null;
        dayEvents.push(buildChoreEvent(chart, assignee
          ? [{
              id: `chore-attendee-${chart.id}-${selectedDate}`,
              event_id: `chore-${chart.id}-${selectedDate}`,
              family_member_id: assignee.id,
              status: "going" as const,
              family_member: { id: assignee.id, nickname: assignee.nickname },
            }]
          : []));
      } else {
        const slot = chart.chore_chart_slots.find((s) => s.day_of_week === selectedDow);
        if (slot) {
          dayEvents.push(buildChoreEvent(chart, [{
            id: `chore-attendee-${slot.id}`,
            event_id: `chore-${chart.id}-${selectedDate}`,
            family_member_id: slot.assignee_id,
            status: "going" as const,
            family_member: slot.assignee,
          }]));
        }
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
        <Pressable
          className="flex-row items-center gap-1.5"
          onPress={() => setPickerVisible(true)}
        >
          <Text className="text-lg font-bold text-gray-900">
            {monthLabel(selectedMonth)}
          </Text>
          <CaretDown size={16} color="#819067" weight="bold" />
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => setSelectedMonth((m) => shiftMonth(m, 1))}
        >
          <CaretRight size={24} color="#819067" weight="bold" />
        </Pressable>
      </View>

      {/* Month/Year picker modal */}
      <MonthYearPicker
        visible={pickerVisible}
        selectedMonth={selectedMonth}
        onSelect={setSelectedMonth}
        onClose={() => setPickerVisible(false)}
      />

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
