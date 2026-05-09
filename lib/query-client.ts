/**
 * TanStack Query Client Configuration
 *
 * Creates and exports a singleton QueryClient instance used by
 * QueryClientProvider in the root layout.
 *
 * Default options:
 * - staleTime: 5 minutes — data is considered fresh for 5 min after fetch
 * - gcTime: 10 minutes — unused cache entries are garbage collected after 10 min
 * - retry: 2 — failed queries retry twice before surfacing an error
 *
 * These defaults can be overridden per-query using queryOptions().
 *
 * @see https://tanstack.com/query/latest/docs/react/reference/QueryClient
 */
import { QueryCache, QueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = error?.message ?? "";
      if (
        message.includes("JWT") ||
        message.includes("not authenticated") ||
        (error as { code?: string }).code === "PGRST301"
      ) {
        supabase.auth.signOut();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
    },
  },
});
