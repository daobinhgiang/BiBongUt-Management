import { supabase } from "@/lib/supabase";

export async function joinFamily({
  inviteCode,
  userId,
  nickname,
}: {
  inviteCode: string;
  userId: string;
  nickname: string;
}) {
  const { data: invite, error: inviteErr } = await supabase
    .from("family_invites")
    .select("id, family_id, expires_at, accepted_at")
    .eq("token", inviteCode)
    .maybeSingle();
  if (inviteErr) throw inviteErr;
  if (!invite) throw new Error("Invalid invite code");
  if (invite.accepted_at) throw new Error("This invite has already been used");
  if (new Date(invite.expires_at) < new Date())
    throw new Error("This invite has expired");

  const { error: memberErr } = await supabase
    .from("family_members")
    .insert({
      family_id: invite.family_id,
      user_id: userId,
      role: "child" as const,
      nickname,
    });
  if (memberErr) throw memberErr;

  await supabase
    .from("family_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return invite;
}
