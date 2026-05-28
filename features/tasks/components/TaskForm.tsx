import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextT,
  FileText,
  User,
  CoinVertical,
  CalendarBlank,
  ArrowsClockwise,
  Check,
} from "phosphor-react-native";

import { DueDateField } from "./DueDateField";
import { ActivityAutocomplete } from "./ActivityAutocomplete";
import {
  createTaskSchema,
  type CreateTaskFormValues,
} from "../schemas";
import { localToday } from "../types";
import { useFamilyMembers } from "@/features/families";

const RECURRENCES = ["none", "daily", "weekly", "monthly"] as const;

type Props = {
  onSubmit: (values: CreateTaskFormValues) => void;
  isPending: boolean;
  familyId: string | undefined;
  initialValues?: Partial<CreateTaskFormValues>;
  submitLabel?: string;
  pendingLabel?: string;
};

export function TaskForm({
  onSubmit,
  isPending,
  familyId,
  initialValues,
  submitLabel = "Create Task",
  pendingLabel = "Saving...",
}: Props) {
  const { data: members = [] } = useFamilyMembers(familyId);
  const isEdit = !!initialValues;
  const [showDescription, setShowDescription] = useState(
    !!initialValues?.description?.trim(),
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignee_id: null,
      coins_reward: 5,
      due_date: localToday(),
      recurrence: "none",
      ...initialValues,
    },
  });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Item */}
      <View className="gap-1" style={{ zIndex: 999 }}>
        <FieldLabel icon={<TextT size={14} color="#6b7a54" />} label="Item" />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <ActivityAutocomplete
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              familyId={familyId}
              autoFocus={!isEdit}
            />
          )}
        />
        {errors.title && (
          <Text className="text-xs text-red-500">{errors.title.message}</Text>
        )}
      </View>

      {/* Description */}
      <View className="gap-2">
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => {
            setShowDescription((prev) => {
              if (prev) setValue("description", "");
              return !prev;
            });
          }}
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded border-2 ${
              showDescription
                ? "border-jungle-500 bg-jungle-500"
                : "border-bark-200 bg-white"
            }`}
          >
            {showDescription && <Check size={12} color="#fff" weight="bold" />}
          </View>
          <View className="flex-row items-center gap-1.5">
            <FileText size={14} color="#6b7a54" />
            <Text className="text-sm font-medium text-jungle-700">
              Add description
            </Text>
          </View>
        </Pressable>
        {showDescription && (
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="rounded-lg border border-bark-200 px-3 py-2"
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
        )}
      </View>

      {/* Assignee */}
      <View className="gap-1">
        <FieldLabel icon={<User size={14} color="#6b7a54" />} label="Assign to" />
        <Controller
          control={control}
          name="assignee_id"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                className={`rounded-full px-3 py-1.5 ${
                  value === null ? "bg-jungle-500" : "bg-bark-100"
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
                    value === m.id ? "bg-jungle-500" : "bg-bark-100"
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

      {/* Coins */}
      <View className="gap-1">
        <FieldLabel
          icon={<CoinVertical size={14} color="#d97706" weight="fill" />}
          label="Coins"
        />
        <Controller
          control={control}
          name="coins_reward"
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

      {/* Due Date */}
      <View className="gap-1">
        <FieldLabel
          icon={<CalendarBlank size={14} color="#6b7a54" />}
          label="Due date"
        />
        <Controller
          control={control}
          name="due_date"
          render={({ field: { onChange, value } }) => (
            <DueDateField value={value} onChange={onChange} />
          )}
        />
      </View>

      {/* Recurrence */}
      <View className="gap-1">
        <FieldLabel
          icon={<ArrowsClockwise size={14} color="#6b7a54" />}
          label="Recurrence"
        />
        <Controller
          control={control}
          name="recurrence"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {RECURRENCES.map((r) => (
                <Pressable
                  key={r}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    value === r ? "bg-jungle-500" : "bg-bark-100"
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
          isPending ? "bg-jungle-400" : "bg-jungle-500"
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

function FieldLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-sm font-medium text-jungle-700">{label}</Text>
    </View>
  );
}
