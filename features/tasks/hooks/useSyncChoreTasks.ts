import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { useChoreCharts } from "@/features/choreCharts";
import { localToday } from "@/lib/date";
import { taskKeys } from "../api/queries";
import type { ChoreChartWithSlots } from "@/features/choreCharts/types";

/**
 * Convert JS getDay() (0=Sun) to chore chart day_of_week (0=Mon).
 */
function jsDayToChoreDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * On mount, syncs chore chart slots for today into the tasks table.
 * Skips any chore that already has a task for today (by source_chart_id + due_date).
 */
export function useSyncChoreTasks() {
  const { data: family } = useFamily();
  const { data: charts } = useChoreCharts();
  const qc = useQueryClient();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!family || !charts || charts.length === 0) return;

    const today = localToday();
    // Only sync once per day per session
    if (syncedRef.current === today) return;

    const todayDow = jsDayToChoreDay(new Date().getDay());

    void syncChoreTasks(charts, todayDow, today, family).then(() => {
      syncedRef.current = today;
      qc.invalidateQueries({ queryKey: taskKeys.all(family.family_id) });
    });
  }, [family, charts, qc]);
}

async function syncChoreTasks(
  charts: ChoreChartWithSlots[],
  todayDow: number,
  today: string,
  family: { family_id: string; id: string },
) {
  // Collect all chore charts that have a slot for today
  const todayChores: {
    chart: ChoreChartWithSlots;
    assigneeId: string;
  }[] = [];

  for (const chart of charts) {
    if (chart.schedule_type === "rotate_weekly") {
      // For rotation charts, the entire chart is one weekly task — skip daily sync
      continue;
    }
    const slot = chart.chore_chart_slots.find((s) => s.day_of_week === todayDow);
    if (slot) {
      todayChores.push({ chart, assigneeId: slot.assignee_id });
    }
  }

  if (todayChores.length === 0) return;

  // Check which chore tasks already exist for today
  const chartIds = todayChores.map((c) => c.chart.id);
  const { data: existing } = await supabase
    .from("tasks")
    .select("source_chart_id")
    .in("source_chart_id", chartIds)
    .eq("due_date", today);

  const existingChartIds = new Set(
    (existing ?? []).map((t) => t.source_chart_id),
  );

  // Create missing tasks
  const toInsert = todayChores
    .filter((c) => !existingChartIds.has(c.chart.id))
    .map((c) => ({
      title: c.chart.title,
      description: c.chart.description,
      family_id: family.family_id,
      created_by: family.id,
      assignee_id: c.assigneeId,
      due_date: today,
      difficulty: c.chart.difficulty,
      points: c.chart.points,
      coins_reward: c.chart.coins_reward,
      source_chart_id: c.chart.id,
      recurrence: "none" as const,
    }));

  if (toInsert.length === 0) return;

  await supabase.from("tasks").insert(toInsert);
}
