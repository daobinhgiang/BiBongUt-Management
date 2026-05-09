import { useCallback, createElement, type ChangeEventHandler } from "react";

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
 */
export function DueDateField({ value, onChange }: Props) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const v = e.currentTarget?.value ?? "";
      onChange(v.trim() !== "" ? v : null);
    },
    [onChange],
  );

  return createElement("input", {
    type: "date",
    value: value ?? "",
    min: localIsoToday(),
    "aria-label":
      value != null && value !== ""
        ? `Due date ${value}`
        : "Due date — tap or click to choose a date",
    onChange: handleChange,
    className:
      "w-full rounded-lg border border-bark-200 px-3 py-2 bg-white box-border text-base outline-none focus-visible:ring-2 focus-visible:ring-jungle-500 outline-offset-[-1px] min-h-[44px]",
    style:
      value == null || value === ""
        ? { color: "#9ca3af" }
        : { color: "#111827" },
  });
}
