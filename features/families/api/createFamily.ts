import { supabase } from "@/lib/supabase";

export async function createFamily({
  name,
  nickname,
}: {
  name: string;
  nickname: string;
}) {
  const { data, error } = await supabase.rpc("create_family_with_member", {
    p_name: name,
    p_nickname: nickname,
  });
  if (error) throw error;
  return data as string; // family id
}
