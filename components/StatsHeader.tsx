import { View, Text } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Lightning,
  CurrencyCircleDollar,
  Fire,
} from "phosphor-react-native";

import { useMyProfile } from "@/features/gamification";
import { levelProgress, xpForLevel } from "@/features/gamification";

const BANNER_HEIGHT = 120;
const AVATAR_SIZE = 86;
const AVATAR_OVERLAP = AVATAR_SIZE * 0.45;

export function StatsHeader() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();

  if (!profile) return null;

  const progress = levelProgress(profile.total_xp) * 100;
  const currentThreshold = xpForLevel(profile.level);
  const nextThreshold = xpForLevel(profile.level + 1);
  const xpInLevel = profile.total_xp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;

  return (
    <View style={{ backgroundColor: "#f5f2ea" }}>
      {/* Banner */}
      <View
        style={{
          height: BANNER_HEIGHT + insets.top,
          paddingTop: insets.top,
          backgroundColor: "#566341",
        }}
      />

      {/* Profile row */}
      <View
        style={{ marginTop: -AVATAR_OVERLAP }}
        className="px-5 pb-4"
      >
        <View className="flex-row">
          {/* Avatar */}
          <View
            className="shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{
              width: AVATAR_SIZE + 6,
              height: AVATAR_SIZE + 6,
              borderWidth: 3,
              borderColor: "#f5f2ea",
              backgroundColor: "#f5f2ea",
            }}
          >
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  borderRadius: AVATAR_SIZE / 2,
                }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                className="items-center justify-center rounded-full bg-jungle-200"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              >
                <Text
                  className="font-bold text-jungle-700"
                  style={{ fontSize: Math.round(AVATAR_SIZE * 0.36) }}
                >
                  {profile.nickname.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Stats — bottom-aligned to avatar */}
          <View
            className="ml-4 min-w-0 flex-1 justify-end"
            style={{ paddingBottom: 6 }}
          >
            {/* Level badge */}
            <View className="flex-row items-center">
              <View
                className="flex-row items-center gap-1 rounded-full px-2.5"
                style={{ backgroundColor: "rgba(154, 168, 126, 0.18)", height: 26 }}
              >
                <Lightning size={14} color="#fbbf24" weight="fill" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#566341" }}>
                  Lv.{profile.level}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="mt-2 flex-row items-center">
              <View className="flex-row items-center gap-1">
                <Lightning size={15} color="#9aa87e" weight="fill" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1f2937" }}>
                  {xpInLevel}
                </Text>
                <Text style={{ fontSize: 13, color: "#9ca3af" }}>
                  / {xpNeeded}
                </Text>
              </View>
              <View
                style={{ width: 1, height: 14, backgroundColor: "#d1d5db", marginHorizontal: 10 }}
              />
              <View className="flex-row items-center gap-1">
                <CurrencyCircleDollar size={15} color="#f59e0b" weight="fill" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1f2937" }}>
                  {profile.coins}
                </Text>
              </View>
              <View
                style={{ width: 1, height: 14, backgroundColor: "#d1d5db", marginHorizontal: 10 }}
              />
              <View className="flex-row items-center gap-1">
                <Fire size={15} color="#ef4444" weight="fill" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1f2937" }}>
                  {profile.current_streak}
                </Text>
              </View>
            </View>

            {/* XP progress bar */}
            <View
              className="mt-2.5 overflow-hidden rounded-full"
              style={{
                height: 6,
                backgroundColor: "rgba(197, 204, 177, 0.35)",
                maxWidth: 220,
              }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(progress, 3)}%`,
                  backgroundColor: "#9aa87e",
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
