import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/ctx";
import { getMyFamily } from "@/features/families";

export function useCurrentMember() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["my-family", session?.user.id],
    queryFn: () => getMyFamily(session!.user.id),
    enabled: !!session?.user.id,
  });
}
