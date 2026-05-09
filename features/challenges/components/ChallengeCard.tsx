import { Pressable, Text, View } from "react-native";
import {
  Lightning,
  CurrencyCircleDollar,
  Sword,
  Users,
  User,
  CalendarBlank,
} from "phosphor-react-native";
import { CHALLENGE_TYPE_LABELS, type ChallengeWithParticipants } from "../types";
import { ProgressBar } from "./ProgressBar";

const TYPE_COLORS = {
  solo: { bg: "bg-jungle-100", text: "text-jungle-700" },
  collaborative: { bg: "bg-blue-100", text: "text-blue-700" },
  boss_battle: { bg: "bg-red-100", text: "text-red-700" },
} as const;

function typeIcon(type: string, size: number) {
  switch (type) {
    case "solo":
      return <User size={size} color="#2d6a4f" weight="fill" />;
    case "collaborative":
      return <Users size={size} color="#1d4ed8" weight="fill" />;
    case "boss_battle":
      return <Sword size={size} color="#dc2626" weight="fill" />;
    default:
      return null;
  }
}

type Props = {
  challenge: ChallengeWithParticipants;
  onPress: () => void;
  myMemberId?: string;
};

export function ChallengeCard({ challenge, onPress, myMemberId }: Props) {
  const participants = challenge.challenge_participants ?? [];
  const totalValue =
    challenge.type === "solo"
      ? participants.find((p) => p.family_member_id === myMemberId)
          ?.current_value ?? 0
      : participants.reduce((sum, p) => sum + p.current_value, 0);
  const isJoined = participants.some(
    (p) => p.family_member_id === myMemberId,
  );
  const colors = TYPE_COLORS[challenge.type];

  return (
    <Pressable
      className="gap-3 rounded-2xl border border-bark-50 bg-white p-4 shadow-sm"
      onPress={onPress}
    >
      {/* Header row */}
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-gray-900">
            {challenge.title}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            {/* Type badge */}
            <View
              className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${colors.bg}`}
            >
              {typeIcon(challenge.type, 12)}
              <Text className={`text-xs font-medium ${colors.text}`}>
                {CHALLENGE_TYPE_LABELS[challenge.type]}
              </Text>
            </View>

            {/* Participants count */}
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

            {/* Joined indicator */}
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

      {/* Progress */}
      {challenge.status === "active" && (
        <ProgressBar
          current={totalValue}
          target={challenge.target_value}
          unit={challenge.unit}
          color={
            challenge.type === "boss_battle" ? "bg-red-500" : "bg-jungle-500"
          }
        />
      )}
    </Pressable>
  );
}
