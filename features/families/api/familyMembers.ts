import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type FamilyRole = Database["public"]["Enums"]["family_role"];

export type FamilyMemberOption = {
  id: string;
  nickname: string;
  role: FamilyRole;
};

async function fetchFamilyMembers(
  familyId: string,
): Promise<FamilyMemberOption[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, nickname, role")
    .eq("family_id", familyId)
    .neq("role", "admin")
    .order("nickname");

  if (error) throw error;
  return data;
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: () => fetchFamilyMembers(familyId!),
    enabled: !!familyId,
  });
}

/** Returns only members who can participate (excludes admin) */
export function useSelectableMembers(familyId: string | undefined) {
  const query = useFamilyMembers(familyId);
  const data = useMemo(
    () => query.data?.filter((m) => m.role !== "admin"),
    [query.data],
  );
  return { ...query, data };
}
