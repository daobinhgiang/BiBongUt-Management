import { supabase } from "@/lib/supabase";

export async function getMyFamily(userId: string) {
  const { data, error } = await supabase
    .from("family_members")
    .select("id, family_id, role, nickname, families(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
