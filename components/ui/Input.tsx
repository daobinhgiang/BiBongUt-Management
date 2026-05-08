/**
 * Input Component (Stub)
 *
 * Reusable text input with label, error message, and icon support.
 * Will integrate with react-hook-form via Controller.
 *
 * TODO: Implement with TextInput + NativeWind styling
 */
import { TextInput, View, Text } from "react-native";

export function Input({
  label,
  placeholder,
}: {
  label?: string;
  placeholder?: string;
}) {
  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-gray-700">{label}</Text>}
      <TextInput
        className="rounded-lg border border-gray-300 px-3 py-2"
        placeholder={placeholder}
      />
    </View>
  );
}
