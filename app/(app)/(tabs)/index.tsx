import { View, Text } from "react-native";
import { Image } from "expo-image";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-bark-50">
      <Image
        source={require("@/assets/images/logo.png")}
        style={{ width: 96, height: 96 }}
        contentFit="contain"
      />
      <Text className="mt-3 text-xl font-semibold text-jungle-800">Home</Text>
      <Text className="mt-2 text-gray-500">Dashboard coming soon</Text>
    </View>
  );
}
