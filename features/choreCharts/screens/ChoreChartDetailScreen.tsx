import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Lightning, Pencil, Trash, User } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useFamilyMembers } from "@/features/families/api/familyMembers";
import { useChoreChart } from "../api/queries";
import { useDeleteChoreChart } from "../api/mutations";
import { WeeklyGridView } from "../components/WeeklyGridView";

export function ChoreChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: chart, isLoading } = useChoreChart(id);
  const { data: members } = useFamilyMembers(family?.family_id);
  const deleteChart = useDeleteChoreChart();

  // Calculate current rotation member
  const currentRotationMember = (() => {
    if (!chart || chart.schedule_type !== "rotate_weekly" || !members) return null;
    const isoWeek = getISOWeek();
    const len = chart.rotation_members.length;
    if (len === 0) return null;
    const assigneeId = chart.rotation_members[isoWeek % len];
    return members.find((m) => m.id === assigneeId) ?? null;
  })();

  const handleDelete = () => {
    Alert.alert("Delete Chore Chart", "This won't delete tasks already generated.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteChart.mutate(id, {
            onSuccess: () => router.back(),
            onError: (err) => Alert.alert("Error", err.message),
          });
        },
      },
    ]);
  };

  if (isLoading || !chart) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bark-50" contentContainerClassName="gap-5 px-4 py-6 pb-32">
      {/* Header */}
      <View className="gap-1">
        <Text className="text-2xl font-bold text-gray-900">{chart.title}</Text>
        {chart.description && (
          <Text className="text-base text-gray-600">{chart.description}</Text>
        )}
      </View>

      {/* Meta */}
      <View className="flex-row gap-3">
        <View className="flex-row items-center gap-1">
          <Lightning size={16} color="#819067" weight="fill" />
          <Text className="text-sm font-medium text-jungle-600">
            {chart.points} XP / {chart.coins_reward} coins
          </Text>
        </View>
        <Text className="text-sm capitalize text-gray-500">{chart.difficulty}</Text>
      </View>

      {/* Weekly Grid */}
      <WeeklyGridView chart={chart} currentRotationMember={currentRotationMember} />

      {/* Rotation order */}
      {chart.schedule_type === "rotate_weekly" && members ? (
        <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700">
            Rotation Order
          </Text>
          {chart.rotation_members.map((memberId, i) => {
            const member = members.find((m) => m.id === memberId);
            return (
              <View key={memberId} className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-gray-400">
                  {`${i + 1}.`}
                </Text>
                <User size={14} color="#6b7280" />
                <Text className="text-sm text-gray-700">
                  {member?.nickname ?? "Unknown"}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Actions */}
      {family != null && (
        <View className="gap-3">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl bg-jungle-500 py-4"
            onPress={() => router.push(`/(app)/chore-charts/${id}/edit`)}
          >
            <Pencil size={18} color="#fff" />
            <Text className="text-base font-semibold text-white">Edit Schedule</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 py-3"
            onPress={handleDelete}
          >
            <Trash size={18} color="#ef4444" />
            <Text className="text-sm font-medium text-red-500">Delete Chart</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function getISOWeek(): number {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const daysSinceJan4 = Math.floor((now.getTime() - jan4.getTime()) / 86400000);
  return Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
}
