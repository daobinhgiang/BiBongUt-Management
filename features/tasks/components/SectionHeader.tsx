import { Text, View } from "react-native";

type Props = { title: string };

export function SectionHeader({ title }: Props) {
  return (
    <View className="mt-6 mb-2 flex-row items-center gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </Text>
      <View className="flex-1 border-t border-bark-200" />
    </View>
  );
}
