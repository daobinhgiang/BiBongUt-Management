import { supabase } from "@/lib/supabase";

export async function joinFamily({
  inviteCode,
  nickname,
}: {
  inviteCode: string;
  nickname: string;
}) {
  const { data, error } = await supabase.rpc("join_family_with_invite", {
    p_invite_code: inviteCode,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string; // family id
}
