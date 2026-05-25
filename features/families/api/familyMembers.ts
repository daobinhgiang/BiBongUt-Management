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

  // #region agent log
  fetch("http://127.0.0.1:7518/ingest/e0e42e5a-d55b-4f5c-99f4-afe6791eacb2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "76ae7a",
    },
    body: JSON.stringify({
      sessionId: "76ae7a",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "familyMembers.ts:fetchFamilyMembers",
      message: "Assignable members fetched",
      data: {
        familyId,
        usedRpc: rpcError?.code !== "PGRST202",
        count: data?.length ?? 0,
        nicknames: data?.map((m) => m.nickname) ?? [],
        roles: data?.map((m) => m.role) ?? [],
        error: error?.message ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
