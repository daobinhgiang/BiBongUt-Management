import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextT,
  FileText,
  Lightning,
  CurrencyCircleDollar,
  CalendarBlank,
  Sword,
  Users,
  CheckCircle,
  Plus,
  Trash,
  Target,
} from "phosphor-react-native";

import { DueDateField } from "@/features/tasks/components/DueDateField";
import { useFamilyMembers } from "@/features/families";
import {
  createChallengeSchema,
  type CreateChallengeFormValues,
} from "../schemas";
import { BOSS_TEMPLATES, type BossTemplate } from "../templates";
import type { TaskDifficulty } from "@/features/tasks/types";

const DAMAGE_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

type Props = {
  onSubmit: (values: CreateChallengeFormValues) => void;
  isPending: boolean;
  familyId: string | undefined;
  creatorMemberId: string | undefined;
};

export function ChallengeForm({
  onSubmit,
  isPending,
  familyId,
  creatorMemberId,
}: Props) {
  const { data: members = [] } = useFamilyMembers(familyId);
  const [mode, setMode] = useState<"pick" | "custom" | "template">("pick");
  const [selectedTemplate, setSelectedTemplate] = useState<BossTemplate | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateChallengeFormValues>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: "",
      description: "",
      boss_name: "",
      boss_emoji: "👹",
      template_id: null,
      reward_xp: 100,
      reward_coins: 50,
      end_date: null,
      participant_ids: [],
      tasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tasks",
  });

  const tasks = watch("tasks");
  const totalDamage = tasks.reduce((sum, t) => sum + (t.damage || 0), 0);

  function selectTemplate(template: BossTemplate) {
    setSelectedTemplate(template);
    setMode("template");
    reset({
      title: template.title,
      description: template.description,
      boss_name: template.bossName,
      boss_emoji: template.bossEmoji,
      template_id: template.id,
      reward_xp: template.rewardXp,
      reward_coins: template.rewardCoins,
      end_date: null,
      participant_ids: [],
      tasks: template.tasks.map((t) => ({
        title: t.title,
        difficulty: t.difficulty,
        damage: t.damage,
      })),
    });
  }

  function startCustom() {
    setMode("custom");
    setSelectedTemplate(null);
    reset({
      title: "",
      description: "",
      boss_name: "",
      boss_emoji: "👹",
      template_id: null,
      reward_xp: 100,
      reward_coins: 50,
      end_date: null,
      participant_ids: [],
      tasks: [],
    });
  }

  // ── Mode: Pick template or custom ──
  if (mode === "pick") {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="px-4 py-6 gap-4"
      >
        <Text className="text-lg font-bold text-gray-900">
          Choose a Boss Battle
        </Text>
        <Text className="text-sm text-gray-500">
          Pick a pre-made boss or create your own.
        </Text>

        {BOSS_TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            className="flex-row items-center gap-3 rounded-2xl border border-bark-200 bg-white p-4"
            onPress={() => selectTemplate(t)}
          >
            <Text className="text-4xl">{t.bossEmoji}</Text>
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-gray-900">
                {t.bossName}
              </Text>
              <Text className="text-xs text-gray-500" numberOfLines={2}>
                {t.description}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-0.5">
                  <Sword size={12} color="#dc2626" />
                  <Text className="text-xs font-medium text-red-600">
                    {t.tasks.reduce((s, tk) => s + tk.damage, 0)} HP
                  </Text>
                </View>
                <View className="flex-row items-center gap-0.5">
                  <Target size={12} color="#6b7280" />
                  <Text className="text-xs text-gray-500">
                    {t.tasks.length} tasks
                  </Text>
                </View>
                <View className="flex-row items-center gap-0.5">
                  <Lightning size={12} color="#819067" weight="fill" />
                  <Text className="text-xs text-jungle-600">{t.rewardXp} XP</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-bark-200 py-6"
          onPress={startCustom}
        >
          <Plus size={20} color="#819067" />
          <Text className="text-base font-semibold text-jungle-600">
            Create Custom Boss
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Mode: Template or Custom form ──
  const isTemplate = mode === "template";

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Back to picker */}
      <Pressable onPress={() => setMode("pick")}>
        <Text className="text-sm font-medium text-jungle-600">
          ← Choose a different boss
        </Text>
      </Pressable>

      {/* Boss preview */}
      <View className="items-center gap-2 rounded-2xl bg-red-50 p-4">
        <Text className="text-5xl">{watch("boss_emoji")}</Text>
        <Text className="text-lg font-bold text-red-700">
          {watch("boss_name") || "Your Boss"}
        </Text>
        <View className="flex-row items-center gap-1">
          <Sword size={14} color="#dc2626" />
          <Text className="text-sm font-semibold text-red-600">
            {totalDamage} HP
          </Text>
        </View>
      </View>

      {/* Boss Name + Emoji (editable for custom, read-only for template) */}
      {!isTemplate && (
        <>
          <View className="gap-1">
            <FieldLabel
              icon={<Sword size={14} color="#6b7a54" />}
              label="Boss Name"
            />
            <Controller
              control={control}
              name="boss_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-bark-200 px-3 py-2"
                  placeholder="e.g. Homework Hydra"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  autoFocus
                />
              )}
            />
            {errors.boss_name && (
              <Text className="text-xs text-red-500">
                {errors.boss_name.message}
              </Text>
            )}
          </View>

          <View className="gap-1">
            <FieldLabel
              icon={<TextT size={14} color="#6b7a54" />}
              label="Challenge Title"
            />
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="rounded-lg border border-bark-200 px-3 py-2"
                  placeholder="e.g. Defeat the Homework Hydra"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
            {errors.title && (
              <Text className="text-xs text-red-500">
                {errors.title.message}
              </Text>
            )}
          </View>

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
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </>
      )}

      {/* Tasks / Quest List */}
      <View className="gap-2">
        <FieldLabel
          icon={<Target size={14} color="#6b7a54" />}
          label={`Quests (${fields.length})`}
        />

        {fields.map((field, index) => (
          <View
            key={field.id}
            className="flex-row items-center gap-2 rounded-lg border border-bark-200 bg-bark-50 p-3"
          >
            <View className="flex-1 gap-1">
              {isTemplate ? (
                <Text className="text-sm font-medium text-gray-800">
                  {tasks[index]?.title}
                </Text>
              ) : (
                <Controller
                  control={control}
                  name={`tasks.${index}.title`}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="rounded border border-bark-200 bg-white px-2 py-1 text-sm"
                      placeholder="Task name"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              )}
              <View className="flex-row items-center gap-2">
                {/* Difficulty chips */}
                <Controller
                  control={control}
                  name={`tasks.${index}.difficulty`}
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row gap-1">
                      {(["easy", "medium", "hard"] as const).map((d) => (
                        <Pressable
                          key={d}
                          className={`rounded-full px-2 py-0.5 ${
                            value === d ? "bg-jungle-500" : "bg-bark-100"
                          }`}
                          onPress={() => {
                            onChange(d);
                            setValue(
                              `tasks.${index}.damage`,
                              DAMAGE_BY_DIFFICULTY[d],
                            );
                          }}
                          disabled={isTemplate}
                        >
                          <Text
                            className={`text-[10px] font-semibold capitalize ${
                              value === d ? "text-white" : "text-gray-500"
                            }`}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                />
                <Text className="text-xs font-medium text-red-500">
                  {tasks[index]?.damage ?? 1} dmg
                </Text>
              </View>
            </View>
            {!isTemplate && (
              <Pressable onPress={() => remove(index)} hitSlop={8}>
                <Trash size={18} color="#dc2626" />
              </Pressable>
            )}
          </View>
        ))}

        {errors.tasks && typeof errors.tasks.message === "string" && (
          <Text className="text-xs text-red-500">{errors.tasks.message}</Text>
        )}

        {/* Add task button (custom only) */}
        {!isTemplate && (
          <Pressable
            className="flex-row items-center justify-center gap-1 rounded-lg border border-dashed border-bark-300 py-2"
            onPress={() =>
              append({ title: "", difficulty: "easy", damage: 1 })
            }
          >
            <Plus size={16} color="#819067" />
            <Text className="text-sm font-medium text-jungle-600">
              Add Quest
            </Text>
          </Pressable>
        )}
      </View>

      {/* Participants */}
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
                      if (isCreator) return;
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

      {/* Submit */}
      <Pressable
        className={`mt-2 rounded-lg py-3 ${
          isPending ? "bg-jungle-400" : "bg-jungle-500"
        }`}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? "Creating..." : "Start Boss Battle"}
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
