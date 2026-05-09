import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarBlank, X } from "phosphor-react-native";
import { createBucketListItemSchema, type CreateBucketListFormValues } from "../schemas";
import { CATEGORY_CONFIG, PRIORITY_XP } from "../types";
import type { BucketListCategory, BucketListPriority } from "../types";

const CATEGORIES: BucketListCategory[] = ["travel", "experience", "skill", "other"];
const PRIORITIES: BucketListPriority[] = ["small", "medium", "large"];

const PRIORITY_COLORS = {
  small: { bg: "bg-green-100", text: "text-green-700", active: "bg-green-500" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", active: "bg-amber-500" },
  large: { bg: "bg-red-100", text: "text-red-700", active: "bg-red-500" },
} as const;

function DatePickerField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: string | null) => void;
}) {
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value + "T00:00:00") : new Date();

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          className="flex-1 flex-row items-center gap-2 rounded-xl border border-bark-200 bg-white px-4 py-3"
          onPress={() => setShow(true)}
        >
          <CalendarBlank size={18} color="#6b7280" />
          <Text className={`text-base ${value ? "text-gray-900" : "text-gray-400"}`}>
            {value
              ? new Date(value + "T00:00:00").toLocaleDateString()
              : "Select a date"}
          </Text>
        </Pressable>
        {value && (
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-bark-100"
            onPress={() => onChange(null)}
            hitSlop={8}
          >
            <X size={16} color="#6b7280" />
          </Pressable>
        )}
      </View>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={new Date()}
          onChange={(_event, selected) => {
            if (Platform.OS === "android") setShow(false);
            if (selected) {
              const yyyy = selected.getFullYear();
              const mm = String(selected.getMonth() + 1).padStart(2, "0");
              const dd = String(selected.getDate()).padStart(2, "0");
              onChange(`${yyyy}-${mm}-${dd}`);
            }
            if (Platform.OS === "ios") setShow(false);
          }}
        />
      )}
    </View>
  );
}

type Props = {
  onSubmit: (values: CreateBucketListFormValues) => void;
  isPending: boolean;
  initialValues?: Partial<CreateBucketListFormValues>;
  submitLabel?: string;
};

export function BucketListForm({
  onSubmit,
  isPending,
  initialValues,
  submitLabel = "Add to Bucket List",
}: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm<CreateBucketListFormValues>({
    resolver: zodResolver(createBucketListItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      target_date: null,
      ...initialValues,
    },
  });

  return (
    <ScrollView className="flex-1 bg-bark-50" contentContainerClassName="gap-5 px-4 py-6">
      {/* Title */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Title</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-xl border border-bark-200 bg-white px-4 py-3 text-base"
              placeholder="e.g. Visit Kyoto"
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

      {/* Description */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Description (optional)</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-xl border border-bark-200 bg-white px-4 py-3 text-base"
              placeholder="Why is this on the list?"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />
          )}
        />
      </View>

      {/* Category */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Category</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isActive = value === cat;
                return (
                  <Pressable
                    key={cat}
                    className={`rounded-full px-4 py-2 ${
                      isActive ? "bg-jungle-500" : config.color.bg
                    }`}
                    onPress={() => onChange(cat)}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? "text-white" : config.color.text
                      }`}
                    >
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* Priority */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Size (XP reward)</Text>
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row gap-2">
              {PRIORITIES.map((p) => {
                const colors = PRIORITY_COLORS[p];
                const isActive = value === p;
                return (
                  <Pressable
                    key={p}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      isActive ? colors.active : colors.bg
                    }`}
                    onPress={() => onChange(p)}
                  >
                    <Text
                      className={`text-sm font-semibold capitalize ${
                        isActive ? "text-white" : colors.text
                      }`}
                    >
                      {p}
                    </Text>
                    <Text
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-gray-400"
                      }`}
                    >
                      {PRIORITY_XP[p]} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
      </View>

      {/* Target Date */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Target Date (optional)</Text>
        <Controller
          control={control}
          name="target_date"
          render={({ field: { onChange, value } }) => (
            <DatePickerField value={value} onChange={onChange} />
          )}
        />
      </View>

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
