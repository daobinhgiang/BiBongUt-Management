import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaretDown, Check, Trash } from "phosphor-react-native";

import { useFamilyMembers } from "@/features/families/api/familyMembers";
import { choreChartSchema, type ChoreChartFormValues } from "../schemas";
import { DAY_LABELS, DIFFICULTY_DEFAULTS } from "../types";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

type Props = {
  familyId: string | undefined;
  onSubmit: (values: ChoreChartFormValues) => void;
  isPending: boolean;
  initialValues?: Partial<ChoreChartFormValues>;
  submitLabel?: string;
};

export function ChoreChartForm({
  familyId,
  onSubmit,
  isPending,
  initialValues,
  submitLabel = "Create Chore Chart",
}: Props) {
  const { data: members } = useFamilyMembers(familyId);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const { control, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<ChoreChartFormValues>({
      resolver: zodResolver(choreChartSchema),
      defaultValues: {
        title: "",
        description: "",
        difficulty: "medium",
        points: 15,
        coins_reward: 7,
        schedule_type: "fixed",
        slots: [],
        rotation_members: [],
        ...initialValues,
      },
    });

  const scheduleType = watch("schedule_type");
  const slots = watch("slots");
  const rotationMembers = watch("rotation_members");

  const addSlot = (dayIndex: number, memberId: string) => {
    const current = slots.filter((s) => s.day_of_week !== dayIndex);
    setValue("slots", [...current, { day_of_week: dayIndex, assignee_id: memberId }]);
    setExpandedDay(null);
  };

  const removeSlot = (dayIndex: number) => {
    setValue("slots", slots.filter((s) => s.day_of_week !== dayIndex));
  };

  const toggleRotationMember = (memberId: string) => {
    const current = rotationMembers;
    if (current.includes(memberId)) {
      setValue("rotation_members", current.filter((id) => id !== memberId));
    } else {
      setValue("rotation_members", [...current, memberId]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-bark-50" contentContainerClassName="gap-5 px-4 py-6">
      {/* Title */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Chore Name</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-xl border border-bark-200 bg-white px-4 py-3 text-base"
              placeholder="e.g. Do Dishes"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoFocus
            />
          )}
        />
        {errors.title && (
          <Text className="text-xs text-red-500">{errors.title.message}</Text>
        )}
      </View>

      {/* Difficulty */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Difficulty</Text>
        <Controller
          control={control}
          name="difficulty"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {DIFFICULTIES.map((d) => {
                const isActive = value === d;
                return (
                  <Pressable
                    key={d}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      isActive
                        ? d === "hard" ? "bg-red-500" : d === "medium" ? "bg-amber-500" : "bg-green-500"
                        : d === "hard" ? "bg-red-100" : d === "medium" ? "bg-amber-100" : "bg-green-100"
                    }`}
                    onPress={() => {
                      onChange(d);
                      const defaults = DIFFICULTY_DEFAULTS[d];
                      setValue("points", defaults.points);
                      setValue("coins_reward", defaults.coins);
                    }}
                  >
                    <Text className={`text-sm font-semibold capitalize ${isActive ? "text-white" : "text-gray-700"}`}>
                      {d}
                    </Text>
                    <Text className={`text-xs ${isActive ? "text-white/80" : "text-gray-400"}`}>
                      {DIFFICULTY_DEFAULTS[d].points} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* Schedule Type Toggle */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Schedule Type</Text>
        <Controller
          control={control}
          name="schedule_type"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              <Pressable
                className={`flex-1 items-center rounded-xl py-3 ${
                  value === "fixed" ? "bg-jungle-500" : "bg-white border border-bark-200"
                }`}
                onPress={() => onChange("fixed")}
              >
                <Text className={`text-sm font-medium ${value === "fixed" ? "text-white" : "text-gray-600"}`}>
                  Fixed Schedule
                </Text>
                <Text className={`text-xs ${value === "fixed" ? "text-white/80" : "text-gray-400"}`}>
                  Same person each day
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 items-center rounded-xl py-3 ${
                  value === "rotate_weekly" ? "bg-purple-500" : "bg-white border border-bark-200"
                }`}
                onPress={() => onChange("rotate_weekly")}
              >
                <Text className={`text-sm font-medium ${value === "rotate_weekly" ? "text-white" : "text-gray-600"}`}>
                  Rotate Weekly
                </Text>
                <Text className={`text-xs ${value === "rotate_weekly" ? "text-white/80" : "text-gray-400"}`}>
                  Takes turns each week
                </Text>
              </Pressable>
            </View>
          )}
        />
      </View>

      {/* Fixed: Day-by-day dropdown assignment */}
      {scheduleType === "fixed" && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">
            Assign days ({slots.length} selected)
          </Text>
          {"slots" in errors && errors.slots && (
            <Text className="text-xs text-red-500">
              {typeof errors.slots === "object" && "message" in errors.slots
                ? (errors.slots as { message?: string }).message
                : "At least one day required"}
            </Text>
          )}
          <View className="gap-2">
            {DAY_LABELS.map((label, dayIndex) => {
              const existingSlot = slots.find((s) => s.day_of_week === dayIndex);
              const assignee = members?.find((m) => m.id === existingSlot?.assignee_id);
              const isExpanded = expandedDay === dayIndex;

              return (
                <View key={dayIndex} style={{ zIndex: isExpanded ? 100 : 0 }}>
                  <View className="flex-row items-center gap-2">
                    <Text className="w-10 text-sm font-medium text-gray-600">{label}</Text>
                    <View className="flex-1">
                      <Pressable
                        className={`flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                          existingSlot
                            ? isExpanded ? "border-jungle-400 bg-jungle-50" : "bg-jungle-50 border-jungle-200"
                            : isExpanded ? "border-jungle-400 bg-jungle-50" : "border-bark-200 bg-white"
                        }`}
                        onPress={() => setExpandedDay(isExpanded ? null : dayIndex)}
                      >
                        <Text className={`text-sm ${existingSlot ? "font-medium text-jungle-800" : "text-gray-400"}`}>
                          {existingSlot ? (assignee?.nickname ?? "Unknown") : "Select member"}
                        </Text>
                        {existingSlot ? (
                          <Pressable onPress={() => { removeSlot(dayIndex); setExpandedDay(null); }} hitSlop={8}>
                            <Trash size={16} color="#ef4444" />
                          </Pressable>
                        ) : (
                          <CaretDown size={14} color="#9ca3af" weight="bold" />
                        )}
                      </Pressable>

                      {/* Dropdown member list — absolute overlay */}
                      {isExpanded && (
                        <View
                          className="rounded-xl border border-bark-200 bg-white"
                          style={{
                            position: "absolute",
                            top: 44,
                            left: 0,
                            right: 0,
                            zIndex: 999,
                            elevation: 5,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 6,
                          }}
                        >
                          {members?.map((member, i) => (
                            <Pressable
                              key={member.id}
                              className={`px-4 py-3 ${
                                i < (members.length - 1) ? "border-b border-bark-100" : ""
                              }`}
                              onPress={() => addSlot(dayIndex, member.id)}
                            >
                              <Text className="text-sm text-gray-700">{member.nickname}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Rotate: Member selection */}
      {scheduleType === "rotate_weekly" && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">
            Who rotates? ({rotationMembers.length} selected)
          </Text>
          {"rotation_members" in errors && errors.rotation_members && (
            <Text className="text-xs text-red-500">
              {typeof errors.rotation_members === "object" && "message" in errors.rotation_members
                ? (errors.rotation_members as { message?: string }).message
                : "Need at least 2 members"}
            </Text>
          )}
          <View className="gap-2">
            {members?.map((member) => {
              const isSelected = rotationMembers.includes(member.id);
              return (
                <Pressable
                  key={member.id}
                  className={`flex-row items-center gap-3 rounded-xl px-4 py-3 ${
                    isSelected ? "bg-purple-100 border border-purple-300" : "bg-white border border-bark-200"
                  }`}
                  onPress={() => toggleRotationMember(member.id)}
                >
                  <View className={`h-6 w-6 items-center justify-center rounded-full ${
                    isSelected ? "bg-purple-500" : "border-2 border-bark-300"
                  }`}>
                    {isSelected && <Check size={14} color="#fff" weight="bold" />}
                  </View>
                  <Text className={`text-base ${isSelected ? "font-medium text-purple-800" : "text-gray-700"}`}>
                    {member.nickname}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Submit */}
      <Pressable
        className={`rounded-xl py-4 ${isPending ? "bg-jungle-300" : "bg-jungle-500"}`}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
