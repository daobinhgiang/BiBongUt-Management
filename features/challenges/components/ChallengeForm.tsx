import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextT,
  FileText,
  Target,
  Lightning,
  CurrencyCircleDollar,
  CalendarBlank,
  Sword,
  Users,
  User,
  CheckCircle,
} from "phosphor-react-native";

import { DueDateField } from "@/features/tasks/components/DueDateField";
import { useFamilyMembers } from "@/features/families";
import {
  createChallengeSchema,
  type CreateChallengeFormValues,
} from "../schemas";
import type { ChallengeType } from "../types";

const TYPES: { key: ChallengeType; label: string; desc: string }[] = [
  { key: "solo", label: "Solo", desc: "Each hits own target" },
  { key: "collaborative", label: "Team", desc: "All contribute together" },
  { key: "boss_battle", label: "Boss Battle", desc: "Defeat the boss as a team" },
];

const TYPE_DEFAULTS: Record<ChallengeType, { xp: number; coins: number }> = {
  solo: { xp: 30, coins: 15 },
  collaborative: { xp: 50, coins: 25 },
  boss_battle: { xp: 100, coins: 50 },
};

type Props = {
  onSubmit: (values: CreateChallengeFormValues) => void;
  isPending: boolean;
  familyId: string | undefined;
  creatorMemberId: string | undefined;
};

export function ChallengeForm({ onSubmit, isPending, familyId, creatorMemberId }: Props) {
  const { data: members = [] } = useFamilyMembers(familyId);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateChallengeFormValues>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "collaborative",
      target_value: 10,
      unit: "times",
      end_date: null,
      reward_xp: TYPE_DEFAULTS.collaborative.xp,
      reward_coins: TYPE_DEFAULTS.collaborative.coins,
      participant_ids: [],
    },
  });

  const challengeType = watch("type");
  const isTeamMode = challengeType !== "solo";

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View className="gap-1">
        <FieldLabel icon={<TextT size={14} color="#6b7a54" />} label="Title" />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-bark-200 px-3 py-2"
              placeholder="e.g. Family Reading Challenge"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              autoFocus
            />
          )}
        />
        {errors.title && (
          <Text className="text-xs text-red-500">{errors.title.message}</Text>
        )}
      </View>

      {/* Description */}
      <View className="gap-1">
        <FieldLabel
          icon={<FileText size={14} color="#6b7a54" />}
          label="Description (optional)"
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-bark-200 px-3 py-2"
              placeholder="What's this challenge about?"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ?? ""}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        />
      </View>

      {/* Challenge Type */}
      <View className="gap-1">
        <FieldLabel
          icon={<Sword size={14} color="#6b7a54" />}
          label="Challenge Type"
        />
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  className={`flex-row items-center gap-3 rounded-lg border p-3 ${
                    value === t.key
                      ? "border-jungle-500 bg-jungle-50"
                      : "border-bark-200 bg-white"
                  }`}
                  onPress={() => {
                    onChange(t.key);
                    const defaults = TYPE_DEFAULTS[t.key];
                    setValue("reward_xp", defaults.xp);
                    setValue("reward_coins", defaults.coins);
                  }}
                >
                  {t.key === "solo" ? (
                    <User size={20} color={value === t.key ? "#2c351f" : "#9ca3af"} />
                  ) : t.key === "collaborative" ? (
                    <Users size={20} color={value === t.key ? "#2c351f" : "#9ca3af"} />
                  ) : (
                    <Sword size={20} color={value === t.key ? "#dc2626" : "#9ca3af"} />
                  )}
                  <View>
                    <Text
                      className={`text-sm font-semibold ${
                        value === t.key ? "text-jungle-900" : "text-gray-700"
                      }`}
                    >
                      {t.label}
                    </Text>
                    <Text className="text-xs text-gray-400">{t.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      {/* Participants — shown for team modes (collaborative / boss_battle) */}
      {isTeamMode && (
        <View className="gap-1">
          <FieldLabel
            icon={<Users size={14} color="#6b7a54" />}
            label="Participants"
          />
          <Text className="text-xs text-gray-400">
            You are automatically included. Select others to add.
          </Text>
          <Controller
            control={control}
            name="participant_ids"
            render={({ field: { onChange, value } }) => (
              <View className="mt-1 flex-row flex-wrap gap-2">
                {members.map((m) => {
                  const isCreator = m.id === creatorMemberId;
                  const isSelected = isCreator || value.includes(m.id);
                  return (
                    <Pressable
                      key={m.id}
                      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                        isSelected ? "bg-jungle-500" : "bg-bark-100"
                      }`}
                      onPress={() => {
                        if (isCreator) return; // can't deselect yourself
                        if (value.includes(m.id)) {
                          onChange(value.filter((id) => id !== m.id));
                        } else {
                          onChange([...value, m.id]);
                        }
                      }}
                      disabled={isCreator}
                    >
                      {isSelected && (
                        <CheckCircle size={14} color="#fff" weight="fill" />
                      )}
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {m.nickname}
                        {isCreator ? " (you)" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
      )}

      {/* Target & Unit */}
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <FieldLabel
            icon={<Target size={14} color="#6b7a54" />}
            label="Target"
          />
          <Controller
            control={control}
            name="target_value"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="rounded-lg border border-bark-200 px-3 py-2"
                keyboardType="number-pad"
                value={String(value)}
                onChangeText={(t) => {
                  const n = Number(t);
                  onChange(Number.isNaN(n) ? 1 : Math.max(1, n));
                }}
              />
            )}
          />
          {errors.target_value && (
            <Text className="text-xs text-red-500">
              {errors.target_value.message}
            </Text>
          )}
        </View>
        <View className="flex-1 gap-1">
          <FieldLabel
            icon={<TextT size={14} color="#6b7a54" />}
            label="Unit"
          />
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-lg border border-bark-200 px-3 py-2"
                placeholder="e.g. books, push-ups"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
        </View>
      </View>

      {/* Deadline */}
      <View className="gap-1">
        <FieldLabel
          icon={<CalendarBlank size={14} color="#6b7a54" />}
          label="Deadline (optional)"
        />
        <Controller
          control={control}
          name="end_date"
          render={({ field: { onChange, value } }) => (
            <DueDateField value={value} onChange={onChange} />
          )}
        />
      </View>

      {/* Rewards */}
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <FieldLabel
            icon={<Lightning size={14} color="#819067" weight="fill" />}
            label="Reward XP"
          />
          <Controller
            control={control}
            name="reward_xp"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="rounded-lg border border-bark-200 px-3 py-2"
                keyboardType="number-pad"
                value={String(value)}
                onChangeText={(t) => {
                  const n = Number(t);
                  onChange(Number.isNaN(n) ? 0 : n);
                }}
              />
            )}
          />
        </View>
        <View className="flex-1 gap-1">
          <FieldLabel
            icon={<CurrencyCircleDollar size={14} color="#807200" />}
            label="Reward Coins"
          />
          <Controller
            control={control}
            name="reward_coins"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="rounded-lg border border-bark-200 px-3 py-2"
                keyboardType="number-pad"
                value={String(value)}
                onChangeText={(t) => {
                  const n = Number(t);
                  onChange(Number.isNaN(n) ? 0 : n);
                }}
              />
            )}
          />
        </View>
      </View>

      {/* Info note based on type */}
      <View className="rounded-lg bg-bark-50 p-3">
        <Text className="text-xs text-gray-500">
          {challengeType === "solo"
            ? "Each participant must reach the target individually. Anyone can join later."
            : challengeType === "boss_battle"
              ? "Everyone works together to defeat the boss! HP bar shows remaining challenge."
              : "All participants contribute to a shared total."}
        </Text>
      </View>

      {/* Submit */}
      <Pressable
        className={`mt-2 rounded-lg py-3 ${
          isPending ? "bg-jungle-400" : "bg-jungle-500"
        }`}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? "Creating..." : "Create Challenge"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function FieldLabel({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-sm font-medium text-jungle-700">{label}</Text>
    </View>
  );
}
