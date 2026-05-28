import { useEffect } from "react";

import { useSession } from "@/lib/auth/ctx";
import { useDevModeStore } from "@/lib/stores/developer-mode";

/** Loads persisted developer-mode preference when the auth session is known. */
export function DevModeSync() {
  const { session } = useSession();
  const setUserId = useDevModeStore((s) => s.setUserId);

  useEffect(() => {
    setUserId(session?.user.id ?? null);
  }, [session?.user.id, setUserId]);

  return null;
}
