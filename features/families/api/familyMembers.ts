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
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_assignable_family_members",
    { p_family_id: familyId },
  );

  let data = rpcData;
  let error = rpcError;

  if (rpcError?.code === "PGRST202") {
    const fallback = await supabase
      .from("family_members")
      .select("id, nickname, role")
      .eq("family_id", familyId)
      .neq("role", "admin")
      .order("nickname");
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data ?? [];
}

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: () => fetchFamilyMembers(familyId!),
    enabled: !!familyId,
  });
}
