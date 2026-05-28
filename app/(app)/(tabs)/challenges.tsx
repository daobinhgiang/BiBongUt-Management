import { useRouter } from "expo-router";
import { useEffect } from "react";

import { useDevMode } from "@/lib/stores/developer-mode";
import { ChallengeListScreen } from "@/features/challenges";

export default function ChallengesTab() {
  const devMode = useDevMode();
  const router = useRouter();

  useEffect(() => {
    if (!devMode) router.replace("/(app)/(tabs)");
  }, [devMode]);

  if (!devMode) return null;

  return <ChallengeListScreen />;
}
