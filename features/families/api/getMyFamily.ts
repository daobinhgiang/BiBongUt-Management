import { supabase } from "@/lib/supabase";

export type FamilyMember = {
  id: string;
  family_id: string;
  role: string;
  nickname: string;
  families: { id: string; name: string } | null;
};

export async function getMyFamily(
  userId: string,
): Promise<FamilyMember | null> {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, family_id, role, nickname, families(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
