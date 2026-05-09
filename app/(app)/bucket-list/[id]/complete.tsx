import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { BucketListCompleteScreen } from "@/features/bucketList/screens/BucketListCompleteScreen";

export default function CompleteRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Complete Item",
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "#819067",
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              onPress={() => {
                if (router.canGoBack()) router.back();
              }}
              className="ml-1 min-h-[44px] items-center justify-center px-2 py-2"
            >
              <Ionicons name="chevron-back" size={28} color="#819067" />
            </Pressable>
          ),
        }}
      />
      <BucketListCompleteScreen />
    </>
  );
}
