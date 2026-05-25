import { useCallback, useRef, createElement, type ChangeEventHandler } from "react";
import { Pressable } from "react-native";

type Props = {
  value: string | null | undefined;
  onChange: (isoDateOrNull: string | null) => void;
};

function localIsoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * `@react-native-community/datetimepicker` renders null on web.
 * Browser `<input type="date">` opens the native date calendar.
 * Wrapped in a Pressable so tapping anywhere on the row opens the picker.
 */
export function DueDateField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const v = e.currentTarget?.value ?? "";
      onChange(v.trim() !== "" ? v : null);
    },
    [onChange],
  );

  const openPicker = useCallback(() => {
    inputRef.current?.showPicker?.();
  }, []);

  return createElement(
    Pressable,
    { onPress: openPicker, style: { width: "100%" } },
    createElement("input", {
      ref: inputRef,
      type: "date",
      value: value ?? "",
      min: localIsoToday(),
      "aria-label":
        value != null && value !== ""
          ? `Due date ${value}`
          : "Due date — tap or click to choose a date",
      onChange: handleChange,
      className:
        "w-full rounded-lg border border-bark-200 px-3 py-2 bg-white box-border text-base outline-none focus-visible:ring-2 focus-visible:ring-jungle-500 outline-offset-[-1px] min-h-[44px] cursor-pointer",
      style: {
        color: value == null || value === "" ? "#9ca3af" : "#111827",
        pointerEvents: "none",
      },
    }),
  );
}
