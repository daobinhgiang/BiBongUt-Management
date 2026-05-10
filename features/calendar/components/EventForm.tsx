import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  TextT,
  FileText,
  CalendarBlank,
  Clock,
  Users,
} from "phosphor-react-native";

import { createEventSchema, type CreateEventFormValues } from "../schemas";
import { useFamilyMembers } from "@/features/families";

type Props = {
  onSubmit: (values: CreateEventFormValues) => void;
  isPending: boolean;
  familyId: string | undefined;
  initialValues?: Partial<CreateEventFormValues>;
  submitLabel?: string;
};

export function EventForm({
  onSubmit,
  isPending,
  familyId,
  initialValues,
  submitLabel = "Create Event",
}: Props) {
  const { data: members = [] } = useFamilyMembers(familyId);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      all_day: false,
      attendee_ids: [],
      ...initialValues,
    },
  });

  const allDay = watch("all_day");

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
              placeholder="e.g. Movie Night"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              autoFocus={!initialValues}
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

      {/* All Day Toggle */}
      <Controller
        control={control}
        name="all_day"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between rounded-lg border border-bark-200 px-3 py-2">
            <Text className="text-sm font-medium text-jungle-700">All day</Text>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ true: "#819067" }}
            />
          </View>
        )}
      />

      {/* Start Date/Time */}
      <View className="gap-1">
        <FieldLabel
          icon={<CalendarBlank size={14} color="#6b7a54" />}
          label="Start"
        />
        <Controller
          control={control}
          name="start_at"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              <Pressable
                className="rounded-lg border border-bark-200 px-3 py-2"
                onPress={() => setShowStartDate(true)}
              >
                <Text className="text-base text-gray-900">
                  {new Date(value).toLocaleDateString()}
                </Text>
              </Pressable>
              {showStartDate && (
                <DateTimePicker
                  value={new Date(value)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowStartDate(false);
                    if (date) {
                      const prev = new Date(value);
                      date.setHours(prev.getHours(), prev.getMinutes());
                      onChange(date.toISOString());
                    }
                  }}
                />
              )}
              {!allDay && (
                <>
                  <Pressable
                    className="rounded-lg border border-bark-200 px-3 py-2"
                    onPress={() => setShowStartTime(true)}
                  >
                    <Text className="text-base text-gray-900">
                      {new Date(value).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Pressable>
                  {showStartTime && (
                    <DateTimePicker
                      value={new Date(value)}
                      mode="time"
                      display="default"
                      onChange={(_, date) => {
                        setShowStartTime(false);
                        if (date) onChange(date.toISOString());
                      }}
                    />
                  )}
                </>
              )}
            </View>
          )}
        />
        {errors.start_at && (
          <Text className="text-xs text-red-500">{errors.start_at.message}</Text>
        )}
      </View>

      {/* End Date/Time */}
      <View className="gap-1">
        <FieldLabel icon={<Clock size={14} color="#6b7a54" />} label="End" />
        <Controller
          control={control}
          name="end_at"
          render={({ field: { onChange, value } }) => (
            <View className="gap-2">
              <Pressable
                className="rounded-lg border border-bark-200 px-3 py-2"
                onPress={() => setShowEndDate(true)}
              >
                <Text className="text-base text-gray-900">
                  {new Date(value).toLocaleDateString()}
                </Text>
              </Pressable>
              {showEndDate && (
                <DateTimePicker
                  value={new Date(value)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowEndDate(false);
                    if (date) {
                      const prev = new Date(value);
                      date.setHours(prev.getHours(), prev.getMinutes());
                      onChange(date.toISOString());
                    }
                  }}
                />
              )}
              {!allDay && (
                <>
                  <Pressable
                    className="rounded-lg border border-bark-200 px-3 py-2"
                    onPress={() => setShowEndTime(true)}
                  >
                    <Text className="text-base text-gray-900">
                      {new Date(value).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Pressable>
                  {showEndTime && (
                    <DateTimePicker
                      value={new Date(value)}
                      mode="time"
                      display="default"
                      onChange={(_, date) => {
                        setShowEndTime(false);
                        if (date) onChange(date.toISOString());
                      }}
                    />
                  )}
                </>
              )}
            </View>
          )}
        />
        {errors.end_at && (
          <Text className="text-xs text-red-500">{errors.end_at.message}</Text>
        )}
      </View>

      {/* Attendees */}
      <View className="gap-1">
        <FieldLabel icon={<Users size={14} color="#6b7a54" />} label="Attendees" />
        <Controller
          control={control}
          name="attendee_ids"
          render={({ field: { onChange, value } }) => {
            const allSelected = members.length > 0 && value.length === members.length;
            return (
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  className={`rounded-full px-3 py-1.5 ${
                    allSelected ? "bg-jungle-500" : "bg-bark-100"
                  }`}
                  onPress={() =>
                    onChange(allSelected ? [] : members.map((m) => m.id))
                  }
                >
                  <Text
                    className={`text-sm font-medium ${
                      allSelected ? "text-white" : "text-gray-700"
                    }`}
                  >
                    All
                  </Text>
                </Pressable>
                {members.map((m) => {
                  const selected = value.includes(m.id);
                  return (
                    <Pressable
                      key={m.id}
                      className={`rounded-full px-3 py-1.5 ${
                        selected ? "bg-jungle-500" : "bg-bark-100"
                      }`}
                      onPress={() =>
                        onChange(
                          selected
                            ? value.filter((id) => id !== m.id)
                            : [...value, m.id],
                        )
                      }
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {m.nickname}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          }}
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
          {isPending ? "Saving..." : submitLabel}
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
