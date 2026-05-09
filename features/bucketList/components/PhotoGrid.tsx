import { ActivityIndicator, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { getPhotoUrl } from "../api/photos";

async function fetchSignedUrls(photos: string[]): Promise<string[]> {
  return Promise.all(photos.map((path) => getPhotoUrl(path)));
}

type Props = {
  /** Storage paths (not full URLs) */
  photos: string[];
  onPress?: (index: number) => void;
};

export function PhotoGrid({ photos, onPress }: Props) {
  const { data: urls, isLoading } = useQuery({
    queryKey: ["photo-urls", photos],
    queryFn: () => fetchSignedUrls(photos),
    enabled: photos.length > 0,
    staleTime: 1000 * 60 * 50, // refresh 10 min before expiry
  });

  if (photos.length === 0) return null;

  if (isLoading || !urls) {
    return (
      <View className="h-32 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-1">
      {urls.map((url, i) => (
        <Pressable
          key={photos[i]}
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
            source={{ uri: url }}
            className="h-full w-full"
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      ))}
    </View>
  );
}
