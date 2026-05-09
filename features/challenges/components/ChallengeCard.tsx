import { Pressable, Text, View } from "react-native";
import {
  Lightning,
  CurrencyCircleDollar,
  Sword,
  Users,
  CalendarBlank,
} from "phosphor-react-native";
import type { ChallengeWithDetails } from "../types";

type Props = {
  challenge: ChallengeWithDetails;
  onPress: () => void;
  myMemberId?: string;
};

export function ChallengeCard({ challenge, onPress, myMemberId }: Props) {
  const participants = challenge.challenge_participants ?? [];
  const totalDamage = participants.reduce(
    (sum, p) => sum + p.current_value,
    0,
  );
  const isJoined = participants.some(
    (p) => p.family_member_id === myMemberId,
  );
  const hpRemaining = Math.max(challenge.target_value - totalDamage, 0);
  const hpPct =
    challenge.target_value > 0
      ? Math.round((hpRemaining / challenge.target_value) * 100)
      : 0;

  return (
    <Pressable
      className="gap-3 rounded-2xl border border-bark-50 bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      {/* Header row */}
      <View className="flex-row items-center gap-3">
        <Text className="text-3xl">{challenge.boss_emoji}</Text>
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-gray-900">
            {challenge.boss_name ?? challenge.title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {/* HP badge */}
            <View className="flex-row items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5">
              <Sword size={10} color="#dc2626" />
              <Text className="text-[10px] font-bold text-red-600">
                {hpPct}% HP
              </Text>
            </View>

            {/* Participants */}
            <View className="flex-row items-center gap-0.5">
              <Users size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500">
                {participants.length}
              </Text>
            </View>

            {/* Deadline */}
            {challenge.end_date && (
              <View className="flex-row items-center gap-0.5">
                <CalendarBlank size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400">
                  {new Date(challenge.end_date).toLocaleDateString()}
                </Text>
              </View>
            )}

            {/* Joined */}
            {isJoined && (
              <View className="rounded-full bg-jungle-100 px-1.5 py-0.5">
                <Text className="text-[10px] font-semibold text-jungle-700">
                  Joined
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Rewards */}
        <View className="items-end gap-1">
          <View className="flex-row items-center gap-0.5">
            <Lightning size={14} color="#819067" weight="fill" />
            <Text className="text-sm font-semibold text-jungle-600">
              {challenge.reward_xp} XP
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <CurrencyCircleDollar size={12} color="#807200" />
            <Text className="text-xs font-medium text-bark-500">
              {challenge.reward_coins}
            </Text>
          </View>
        </View>
      </View>

      {/* HP bar mini */}
      {challenge.status === "active" && (
        <View className="h-2 overflow-hidden rounded-full bg-gray-200">
          <View
            className={`h-full rounded-full ${
              hpPct >= 60
                ? "bg-red-500"
                : hpPct >= 30
                  ? "bg-amber-500"
                  : "bg-jungle-500"
            }`}
            style={{ width: `${hpPct}%` }}
          />
        </View>
      )}

      {/* Completed/failed badge */}
      {challenge.status !== "active" && (
        <View
          className={`self-start rounded-full px-2 py-0.5 ${
            challenge.status === "completed"
              ? "bg-jungle-100"
              : "bg-red-100"
          }`}
        >
          <Text
            className={`text-xs font-semibold capitalize ${
              challenge.status === "completed"
                ? "text-jungle-700"
                : "text-red-700"
            }`}
          >
            {challenge.status === "completed" ? "Defeated!" : challenge.status}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
