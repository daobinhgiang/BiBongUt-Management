import { View, Text } from "react-native";
import { House } from "phosphor-react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bark-50">
      <House size={48} color="#819067" weight="duotone" />
      <Text className="mt-3 text-xl font-semibold">Home</Text>
      <Text className="mt-2 text-gray-500">Dashboard coming soon</Text>
    </View>
  );
}
