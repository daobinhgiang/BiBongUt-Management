import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextT,
  FileText,
  CurrencyCircleDollar,
  Gift,
} from "phosphor-react-native";

import {
  createRewardSchema,
  type CreateRewardFormValues,
} from "../schemas";

const EMOJI_OPTIONS = [
  "🎁", "🍕", "🎮", "📱", "🎬", "🍦", "🎨", "🎵",
  "⭐", "🏆", "🎯", "🎪", "🎲", "📚", "🛒", "🎂",
  "🌟", "💎", "🎈", "🧸",
];

type Props = {
  onSubmit: (values: CreateRewardFormValues) => void;
  isPending: boolean;
  initialValues?: Partial<CreateRewardFormValues>;
  submitLabel?: string;
};

export function RewardForm({
  onSubmit,
  isPending,
  initialValues,
  submitLabel = "Create Reward",
}: Props) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRewardFormValues>({
    resolver: zodResolver(createRewardSchema),
    defaultValues: {
      title: "",
      description: "",
      cost_coins: 10,
      icon_url: "🎁",
      ...initialValues,
    },
  });

  const selectedEmoji = watch("icon_url");

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-4 py-6 gap-5"
      keyboardShouldPersistTaps="handled"
    >
      {/* Emoji picker */}
      <View className="gap-1">
        <FieldLabel icon={<Gift size={14} color="#6b7a54" />} label="Icon" />
        <View className="flex-row flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              className={`h-10 w-10 items-center justify-center rounded-lg ${
                selectedEmoji === emoji
                  ? "bg-jungle-100 border-2 border-jungle-500"
                  : "bg-bark-50"
              }`}
              onPress={() => setValue("icon_url", emoji)}
            >
              <Text className="text-xl">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Title */}
      <View className="gap-1">
        <FieldLabel
          icon={<TextT size={14} color="#6b7a54" />}
          label="Title"
        />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-bark-200 px-3 py-2"
              placeholder="e.g. Extra screen time"
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
              placeholder="What does this reward include?"
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

      {/* Cost */}
      <View className="gap-1">
        <FieldLabel
          icon={<CurrencyCircleDollar size={14} color="#807200" />}
          label="Cost (coins)"
        />
        <Controller
          control={control}
          name="cost_coins"
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
        {errors.cost_coins && (
          <Text className="text-xs text-red-500">
            {errors.cost_coins.message}
          </Text>
        )}
      </View>

      {/* Preview */}
      <View className="items-center gap-2 rounded-2xl bg-bark-50 p-4">
        <Text className="text-3xl">{selectedEmoji || "🎁"}</Text>
        <Text className="text-sm font-semibold text-gray-700">
          {watch("title") || "Your Reward"}
        </Text>
        <View className="flex-row items-center gap-1">
          <CurrencyCircleDollar size={14} color="#807200" weight="fill" />
          <Text className="text-sm font-bold text-bark-600">
            {watch("cost_coins")} coins
          </Text>
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
          {isPending ? "Saving..." : submitLabel}
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
