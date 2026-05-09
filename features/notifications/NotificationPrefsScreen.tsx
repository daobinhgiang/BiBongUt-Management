import { ActivityIndicator, Switch, Text, View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useFamily } from "@/features/auth/hooks/useFamily";

type NotificationPrefs = {
  task_assigned: boolean;
  task_overdue: boolean;
  streak_at_risk: boolean;
  badge_unlocked: boolean;
  level_up: boolean;
  family_invite: boolean;
};

const PREF_LABELS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "task_assigned", label: "Task Assigned", description: "When someone assigns a task to you" },
  { key: "task_overdue", label: "Task Overdue", description: "When a task passes its due date" },
  { key: "streak_at_risk", label: "Streak Warning", description: "Evening reminder when your streak is at risk" },
  { key: "badge_unlocked", label: "Badge Unlocked", description: "When you earn a new badge" },
  { key: "level_up", label: "Level Up", description: "When you reach a new level" },
  { key: "family_invite", label: "Family Activity", description: "When someone joins the family" },
];

const DEFAULT_PREFS: NotificationPrefs = {
  task_assigned: true,
  task_overdue: true,
  streak_at_risk: true,
  badge_unlocked: true,
  level_up: true,
  family_invite: true,
};

function useNotificationPrefs() {
  const { data: family } = useFamily();

  return useQuery({
    queryKey: ["notification-prefs", family?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("notification_prefs")
        .eq("id", family!.id)
        .single();
      if (error) throw error;
      return { ...DEFAULT_PREFS, ...(data.notification_prefs as NotificationPrefs) };
    },
    enabled: !!family?.id,
  });
}

function useUpdateNotificationPrefs() {
  const { data: family } = useFamily();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      const { error } = await supabase
        .from("family_members")
        .update({ notification_prefs: prefs })
        .eq("id", family!.id);
      if (error) throw error;
    },
    onSuccess: (_data, prefs) => {
      qc.setQueryData(["notification-prefs", family?.id], prefs);
    },
  });
}

export function NotificationPrefsScreen() {
  const { data: prefs, isLoading } = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();

  if (isLoading || !prefs) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const togglePref = (key: keyof NotificationPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    updatePrefs.mutate(updated);
  };

  return (
    <View className="flex-1 bg-bark-50">
      <View className="px-4 py-6 gap-1">
        {PREF_LABELS.map(({ key, label, description }) => (
          <View
            key={key}
            className="flex-row items-center justify-between rounded-xl bg-white px-4 py-3 mb-2 shadow-sm"
          >
            <View className="flex-1 mr-4">
              <Text className="text-base font-medium text-gray-900">{label}</Text>
              <Text className="text-xs text-gray-500">{description}</Text>
            </View>
            <Switch
              value={prefs[key]}
              onValueChange={() => togglePref(key)}
              trackColor={{ false: "#d1d5db", true: "#819067" }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>
    </View>
  );
}
