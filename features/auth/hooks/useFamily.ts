import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/auth/ctx";

export function useFamily() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["my-family", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, family_id, role, nickname, families(id, name)")
        .eq("user_id", session!.user.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });
}
