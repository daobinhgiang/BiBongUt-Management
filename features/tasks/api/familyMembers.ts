import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";

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

export function useFamilyMembers() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ["family-members", family?.family_id],
    queryFn: () => fetchFamilyMembers(family!.family_id),
    enabled: !!family?.family_id,
  });
}
