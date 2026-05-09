import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { getPhotoUrl } from "../api/photos";

type Props = {
  /** Storage paths (not full URLs) */
  photos: string[];
  onPress?: (index: number) => void;
};

export function PhotoGrid({ photos, onPress }: Props) {
  if (photos.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-1">
      {photos.map((path, i) => (
        <Pressable
          key={path}
          className={`overflow-hidden rounded-lg ${
            photos.length === 1
              ? "w-full aspect-video"
              : photos.length === 2
                ? "w-[49%] aspect-square"
                : "w-[32%] aspect-square"
          }`}
          onPress={() => onPress?.(i)}
        >
          <Image
            source={{ uri: getPhotoUrl(path) }}
            className="h-full w-full"
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      ))}
    </View>
  );
}
