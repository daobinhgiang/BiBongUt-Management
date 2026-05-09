import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type FamilyMemberOption = {
  id: string;
  nickname: string;
};

async function fetchFamilyMembers(
  familyId: string,
): Promise<FamilyMemberOption[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, nickname")
    .eq("family_id", familyId)
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
