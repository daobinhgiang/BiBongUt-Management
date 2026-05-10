import { createElement, useCallback, type ChangeEventHandler } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Switch } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function toDateOnlyValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function WebDateTimeInput({
  value,
  onChange,
  allDay,
  label,
}: {
  value: string;
  onChange: (iso: string) => void;
  allDay: boolean;
  label: string;
}) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const v = e.currentTarget?.value ?? "";
      if (v) onChange(new Date(v).toISOString());
    },
    [onChange],
  );

  return createElement("input", {
    type: allDay ? "date" : "datetime-local",
    value: allDay ? toDateOnlyValue(value) : toDatetimeLocalValue(value),
    "aria-label": label,
    onChange: handleChange,
    className:
      "w-full rounded-lg border border-bark-200 px-3 py-2 bg-white box-border text-base outline-none focus-visible:ring-2 focus-visible:ring-jungle-500 outline-offset-[-1px] min-h-[44px]",
    style: { color: "#111827" },
  });
}

export function EventForm({
  onSubmit,
  isPending,
  familyId,
  initialValues,
  submitLabel = "Create Event",
}: Props) {
  const { data: members = [] } = useFamilyMembers(familyId);

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

      {/* Start */}
      <View className="gap-1">
        <FieldLabel icon={<CalendarBlank size={14} color="#6b7a54" />} label="Start" />
        <Controller
          control={control}
          name="start_at"
          render={({ field: { onChange, value } }) => (
            <WebDateTimeInput
              value={value}
              onChange={onChange}
              allDay={allDay}
              label="Start date and time"
            />
          )}
        />
        {errors.start_at && (
          <Text className="text-xs text-red-500">{errors.start_at.message}</Text>
        )}
      </View>

      {/* End */}
      <View className="gap-1">
        <FieldLabel icon={<Clock size={14} color="#6b7a54" />} label="End" />
        <Controller
          control={control}
          name="end_at"
          render={({ field: { onChange, value } }) => (
            <WebDateTimeInput
              value={value}
              onChange={onChange}
              allDay={allDay}
              label="End date and time"
            />
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
