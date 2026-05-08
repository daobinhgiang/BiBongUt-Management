import { supabase } from "@/lib/supabase";

export async function createFamily({
  name,
  userId,
  nickname,
}: {
  name: string;
  userId: string;
  nickname: string;
}) {
  const { data: family, error: familyErr } = await supabase
    .from("families")
    .insert({ name, created_by: userId })
    .select("id")
    .single();
  if (familyErr) throw familyErr;

  const { error: memberErr } = await supabase
    .from("family_members")
    .insert({
      family_id: family.id,
      user_id: userId,
      role: "parent" as const,
      nickname,
    });
  if (memberErr) throw memberErr;

  return family;
}
