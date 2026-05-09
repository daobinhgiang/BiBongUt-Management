import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  createTaskSchema,
  type CreateTaskFormValues,
} from "../schemas";
import { DIFFICULTY_DEFAULTS } from "../types";
import type { TaskDifficulty } from "../types";
import { useFamilyMembers } from "@/features/families";

const DIFFICULTIES: TaskDifficulty[] = ["easy", "medium", "hard"];
const RECURRENCES = ["none", "daily", "weekly", "monthly"] as const;

type Props = {
  onSubmit: (values: CreateTaskFormValues) => void;
  isPending: boolean;
  initialValues?: Partial<CreateTaskFormValues>;
  submitLabel?: string;
  pendingLabel?: string;
};

export function TaskForm({
  onSubmit,
  isPending,
  initialValues,
  submitLabel = "Create Task",
  pendingLabel = "Saving...",
}: Props) {
  const { data: members = [] } = useFamilyMembers();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEdit = !!initialValues;
  const [userChangedDifficulty, setUserChangedDifficulty] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignee_id: null,
      difficulty: "easy",
      points: DIFFICULTY_DEFAULTS.easy.points,
      coins_reward: DIFFICULTY_DEFAULTS.easy.coins,
      due_date: null,
      recurrence: "none",
      ...initialValues,
    },
  });

  const difficulty = watch("difficulty");

  useEffect(() => {
    if (isEdit && !userChangedDifficulty) return;
    const defaults = DIFFICULTY_DEFAULTS[difficulty];
    setValue("points", defaults.points);
    setValue("coins_reward", defaults.coins);
  }, [difficulty, setValue, isEdit, userChangedDifficulty]);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Title</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g. Take out the trash"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              autoFocus={!isEdit}
            />
          )}
        />
        {errors.title && (
          <Text className="text-xs text-red-500">{errors.title.message}</Text>
        )}
      </View>

      {/* Description */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">
          Description (optional)
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Any extra details..."
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

      {/* Assignee */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Assign to</Text>
        <Controller
          control={control}
          name="assignee_id"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                className={`rounded-full px-3 py-1.5 ${
                  value === null ? "bg-blue-600" : "bg-gray-100"
                }`}
                onPress={() => onChange(null)}
              >
                <Text
                  className={`text-sm font-medium ${
                    value === null ? "text-white" : "text-gray-700"
                  }`}
                >
                  Anyone
                </Text>
              </Pressable>
              {members.map((m) => (
                <Pressable
                  key={m.id}
                  className={`rounded-full px-3 py-1.5 ${
                    value === m.id ? "bg-blue-600" : "bg-gray-100"
                  }`}
                  onPress={() => onChange(m.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      value === m.id ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {m.nickname}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      {/* Difficulty */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Difficulty</Text>
        <Controller
          control={control}
          name="difficulty"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {DIFFICULTIES.map((d) => (
                <Pressable
                  key={d}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    value === d ? "bg-blue-600" : "bg-gray-100"
                  }`}
                  onPress={() => {
                    onChange(d);
                    setUserChangedDifficulty(true);
                  }}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      value === d ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {d}
                  </Text>
                  <Text
                    className={`text-xs ${
                      value === d ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {DIFFICULTY_DEFAULTS[d].points} XP
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      {/* Points & Coins (editable) */}
      <View className="flex-row gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-sm font-medium text-gray-700">XP</Text>
          <Controller
            control={control}
            name="points"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-2"
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
          <Text className="text-sm font-medium text-gray-700">Coins</Text>
          <Controller
            control={control}
            name="coins_reward"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="rounded-lg border border-gray-300 px-3 py-2"
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

      {/* Due Date */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Due date</Text>
        <Controller
          control={control}
          name="due_date"
          render={({ field: { onChange, value } }) => (
            <>
              <Pressable
                className="rounded-lg border border-gray-300 px-3 py-2"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className={value ? "text-gray-900" : "text-gray-400"}>
                  {value
                    ? new Date(value).toLocaleDateString()
                    : "No due date"}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(false);
                    if (date) onChange(date.toISOString().split("T")[0]);
                  }}
                />
              )}
            </>
          )}
        />
      </View>

      {/* Recurrence */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Recurrence</Text>
        <Controller
          control={control}
          name="recurrence"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {RECURRENCES.map((r) => (
                <Pressable
                  key={r}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    value === r ? "bg-blue-600" : "bg-gray-100"
                  }`}
                  onPress={() => onChange(r)}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      value === r ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {r === "none" ? "Once" : r}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </View>

      {/* Submit */}
      <Pressable
        className={`mt-2 rounded-lg py-3 ${
          isPending ? "bg-blue-400" : "bg-blue-600"
        }`}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isPending ? pendingLabel : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
