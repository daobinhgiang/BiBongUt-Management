import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";
import { choreChartKeys } from "./queries";
import type { ChoreChartFormValues } from "../schemas";

// ── Create chart (RPC) ──

type CreateInput = ChoreChartFormValues & {
  family_id: string;
  created_by: string;
};

async function createChart(input: CreateInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_chore_chart", {
    p_family_id: input.family_id,
    p_title: input.title,
    p_description: input.description ?? undefined,
    p_difficulty: input.difficulty,
    p_points: input.points,
    p_coins_reward: input.coins_reward,
    p_schedule_type: input.schedule_type,
    p_rotation_members: input.rotation_members,
    p_slots: JSON.stringify(input.slots),
    p_created_by: input.created_by,
  });

  if (error) throw error;
  return data as string;
}

export function useCreateChoreChart() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: createChart,
    onSuccess: () => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: choreChartKeys.all(family.family_id) });
    },
  });
}

// ── Update chart (RPC) ──

type UpdateInput = ChoreChartFormValues & {
  chart_id: string;
  is_active?: boolean;
};

async function updateChart(input: UpdateInput): Promise<void> {
  const { error } = await supabase.rpc("update_chore_chart", {
    p_chart_id: input.chart_id,
    p_title: input.title,
    p_description: input.description ?? undefined,
    p_difficulty: input.difficulty,
    p_points: input.points,
    p_coins_reward: input.coins_reward,
    p_schedule_type: input.schedule_type,
    p_rotation_members: input.rotation_members,
    p_slots: JSON.stringify(input.slots),
    p_is_active: input.is_active ?? true,
  });

  if (error) throw error;
}

export function useUpdateChoreChart() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: updateChart,
    onSuccess: (_data, vars) => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: choreChartKeys.all(family.family_id) });
      qc.invalidateQueries({ queryKey: choreChartKeys.detail(vars.chart_id) });
    },
  });
}

// ── Delete chart ──

async function deleteChart(chartId: string): Promise<void> {
  const { error } = await supabase
    .from("chore_charts")
    .delete()
    .eq("id", chartId);
  if (error) throw error;
}

export function useDeleteChoreChart() {
  const qc = useQueryClient();
  const { data: family } = useFamily();

  return useMutation({
    mutationFn: deleteChart,
    onSuccess: () => {
      if (!family?.family_id) return;
      qc.invalidateQueries({ queryKey: choreChartKeys.all(family.family_id) });
    },
  });
}
