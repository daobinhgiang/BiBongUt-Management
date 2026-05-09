import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

function toIsoDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export type DueDateFieldProps = {
  value: string | null | undefined;
  onChange: (isoDateOrNull: string | null) => void;
};

/**
 * Due date picker for iOS / Android (@react-native-community/datetimepicker).
 * Web resolves to `DueDateField.web.tsx` — the generic picker renders null there.
 */
export function DueDateField({ value, onChange }: DueDateFieldProps) {
  const [open, setOpen] = useState(false);

  const displayLabel =
    value != null && value !== ""
      ? new Date(`${value}T12:00:00`).toLocaleDateString()
      : "No due date";

  return (
    <View className="gap-1">
      <Pressable
        className="rounded-lg border border-bark-200 px-3 py-2"
        onPress={() => setOpen(true)}
      >
        <Text
          className={value ? "text-base text-gray-900" : "text-base text-gray-400"}
        >
          {displayLabel}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={
            value && value !== ""
              ? new Date(`${value}T12:00:00`)
              : new Date()
          }
          mode="date"
          minimumDate={new Date()}
          display="default"
          onChange={(_, date) => {
            setOpen(false);
            if (date) onChange(toIsoDateOnly(date));
          }}
        />
      ) : null}
    </View>
  );
}
