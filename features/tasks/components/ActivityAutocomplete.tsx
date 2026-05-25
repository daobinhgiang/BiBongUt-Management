import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTaskActivities } from "../api/activity-queries";
import { PRESET_ACTIVITIES } from "../constants/preset-activities";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  familyId: string | undefined;
  placeholder?: string;
  autoFocus?: boolean;
};

export function ActivityAutocomplete({
  value,
  onChange,
  onBlur,
  familyId,
  placeholder = "e.g. Take out the trash",
  autoFocus,
}: Props) {
  const { data: dbActivities = [] } = useTaskActivities(familyId);
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const dbNames = new Set(dbActivities.map((a) => a.name.toLowerCase()));
    const dbList = dbActivities.map((a) => a.name);
    const presetExtras = PRESET_ACTIVITIES.filter(
      (p) => !dbNames.has(p.toLowerCase()),
    ).sort();
    return [...dbList, ...presetExtras];
  }, [dbActivities]);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [value, suggestions]);

  const showDropdown = focused && value.length > 0 && filtered.length > 0;

  return (
    <View style={{ zIndex: 999 }}>
      <TextInput
        className="rounded-lg border border-bark-200 px-3 py-2"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Delay hiding so tap on suggestion registers
          setTimeout(() => setFocused(false), 150);
          onBlur?.();
        }}
        autoFocus={autoFocus}
      />
      {showDropdown && (
        <View
          className="absolute left-0 right-0 rounded-lg border border-bark-200"
          style={{
            top: "100%",
            marginTop: 4,
            maxHeight: 160,
            backgroundColor: "#fff",
            zIndex: 999,
            elevation: 10,
            ...(Platform.OS === "web" ? { position: "absolute" as const, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" } : {}),
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.map((name) => (
              <Pressable
                key={name}
                className="border-b border-bark-100 px-3 py-2.5"
                style={{ backgroundColor: "#fff" }}
                onPress={() => {
                  onChange(name);
                  setFocused(false);
                }}
              >
                <Text className="text-sm text-gray-800">{name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
