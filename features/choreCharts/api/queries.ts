import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import type { ChoreChartWithSlots } from "../types";

const CHART_SELECT =
  "*, chore_chart_slots(*, assignee:family_members!chore_chart_slots_assignee_id_fkey(id, nickname))";

export const choreChartKeys = {
  all: (familyId: string) => ["chore-charts", familyId] as const,
  detail: (chartId: string) => ["chore-charts", "detail", chartId] as const,
};

async function fetchChoreCharts(familyId: string): Promise<ChoreChartWithSlots[]> {
  const { data, error } = await supabase
    .from("chore_charts")
    .select(CHART_SELECT)
    .eq("family_id", familyId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as ChoreChartWithSlots[];
}

async function fetchChoreChart(chartId: string): Promise<ChoreChartWithSlots> {
  const { data, error } = await supabase
    .from("chore_charts")
    .select(CHART_SELECT)
    .eq("id", chartId)
    .single();

  if (error) throw error;
  return data as unknown as ChoreChartWithSlots;
}

export function useChoreCharts() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: choreChartKeys.all(family?.family_id ?? ""),
    queryFn: () => fetchChoreCharts(family!.family_id),
    enabled: !!family?.family_id,
  });
}

export function useChoreChart(chartId: string) {
  return useQuery({
    queryKey: choreChartKeys.detail(chartId),
    queryFn: () => fetchChoreChart(chartId),
    enabled: !!chartId,
  });
}
