import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSharedValue } from "react-native-reanimated";

import { StatsHeader } from "@/components/StatsHeader";
import { TaskListScreen } from "@/features/tasks/screens/TaskListScreen";
import { useCurrentMember } from "@/features/auth/hooks/useCurrentMember";
import { profileKeys } from "@/features/gamification/api/profile";

export default function DoScreen() {
  const coinIconRef = useRef<View>(null);
  const [bonusCoins, setBonusCoins] = useState(0);
  const coinPopScale = useSharedValue(1);
  const qc = useQueryClient();
  const { data: member } = useCurrentMember();

  const handleCoinArrive = useCallback(
    (amount: number) => {
      setBonusCoins((prev) => prev + amount);
    },
    [],
  );

  const handleCoinsAnimationDone = useCallback(async () => {
    if (member?.id) {
      await qc.invalidateQueries({
        queryKey: profileKeys.member(member.id),
      });
    }
    setBonusCoins(0);
  }, [member?.id, qc]);

  return (
    <>
      <StatsHeader coinIconRef={coinIconRef} bonusCoins={bonusCoins} coinPopScale={coinPopScale} />
      <TaskListScreen
        coinIconRef={coinIconRef}
        coinPopScale={coinPopScale}
        onCoinArrive={handleCoinArrive}
        onCoinsAnimationDone={handleCoinsAnimationDone}
      />
    </>
  );
}
