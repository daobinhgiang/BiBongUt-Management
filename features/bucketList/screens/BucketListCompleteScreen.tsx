import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, X, Check } from "phosphor-react-native";

import { useFamily } from "@/features/auth/hooks/useFamily";
import { useSelectableMembers } from "@/features/families/api/familyMembers";
import { XpToast } from "@/features/tasks/components/XpToast";
import { useBucketListItem } from "../api/queries";
import { useCompleteBucketListItem } from "../api/mutations";
import { pickImages, uploadPhotos, removePhotos } from "../api/photos";
import { PRIORITY_XP } from "../types";

export function BucketListCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: family } = useFamily();
  const { data: item, isLoading } = useBucketListItem(id);
  const { data: members } = useSelectableMembers(family?.family_id);
  const completeItem = useCompleteBucketListItem();

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [xpToast, setXpToast] = useState<number | null>(null);

  const handlePickPhotos = async () => {
    const uris = await pickImages(10);
    if (uris.length > 0) {
      setPhotoUris((prev) => [...prev, ...uris]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleSubmit = async () => {
    if (!item || !family) return;

    if (selectedParticipants.length === 0) {
      Alert.alert("Participants", "Select at least one participant who was there.");
      return;
    }

    setIsUploading(true);
    let photoPaths: string[] = [];

    try {
      // Upload photos first
      if (photoUris.length > 0) {
        photoPaths = await uploadPhotos(photoUris, family.family_id, id);
      }

      // Complete via RPC
      await completeItem.mutateAsync({
        itemId: id,
        location: location.trim() || null,
        photos: photoPaths,
        notes: notes.trim() || null,
        participants: selectedParticipants,
      });

      // Show XP celebration, then navigate back
      setXpToast(PRIORITY_XP[item.priority]);
    } catch (err) {
      // Clean up orphaned photos if RPC failed after upload
      if (photoPaths.length > 0) {
        removePhotos(photoPaths).catch(() => {});
      }
      Alert.alert("Error", (err as Error).message ?? "Could not complete item");
    } finally {
      setIsUploading(false);
    }
  };

  const dismissToast = useCallback(() => {
    setXpToast(null);
    router.replace("/(app)/bucket-list");
  }, [router]);

  const isPending = isUploading || completeItem.isPending;

  if (isLoading || !item) {
    return (
      <View className="flex-1 items-center justify-center bg-bark-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
    <ScrollView className="flex-1 bg-bark-50" contentContainerClassName="gap-5 px-4 py-6 pb-32">
      {/* Item info */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900">{item.title}</Text>
        <Text className="mt-1 text-sm text-jungle-600">
          {PRIORITY_XP[item.priority]} XP per participant
        </Text>
      </View>

      {/* Photos */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">Photos</Text>
        <View className="flex-row flex-wrap gap-2">
          {photoUris.map((uri, i) => (
            <View key={uri} className="relative">
              <Image
                source={{ uri }}
                className="h-24 w-24 rounded-lg"
                resizeMode="cover"
              />
              <Pressable
                className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-red-500"
                onPress={() => removePhoto(i)}
              >
                <X size={12} color="#fff" weight="bold" />
              </Pressable>
            </View>
          ))}

          <Pressable
            className="h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-bark-300"
            onPress={handlePickPhotos}
          >
            <Camera size={28} color="#9ca3af" />
            <Text className="mt-1 text-xs text-gray-400">Add</Text>
          </Pressable>
        </View>
      </View>

      {/* Location */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Location (optional)</Text>
        <TextInput
          className="rounded-xl border border-bark-200 bg-white px-4 py-3 text-base"
          placeholder="e.g. Kyoto, Japan"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      {/* Notes */}
      <View className="gap-1">
        <Text className="text-sm font-medium text-gray-700">Notes (optional)</Text>
        <TextInput
          className="rounded-xl border border-bark-200 bg-white px-4 py-3 text-base"
          placeholder="How was the experience?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />
      </View>

      {/* Participants */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-gray-700">
          Who was there? (each gets {PRIORITY_XP[item.priority]} XP)
        </Text>
        <View className="gap-2">
          {members?.map((member) => {
            const isSelected = selectedParticipants.includes(member.id);
            return (
              <Pressable
                key={member.id}
                className={`flex-row items-center gap-3 rounded-xl px-4 py-3 ${
                  isSelected ? "bg-jungle-100 border border-jungle-300" : "bg-white border border-bark-200"
                }`}
                onPress={() => toggleParticipant(member.id)}
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full ${
                    isSelected ? "bg-jungle-500" : "border-2 border-bark-300"
                  }`}
                >
                  {isSelected && <Check size={14} color="#fff" weight="bold" />}
                </View>
                <Text
                  className={`text-base ${
                    isSelected ? "font-medium text-jungle-800" : "text-gray-700"
                  }`}
                >
                  {member.nickname}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Submit */}
      <Pressable
        className={`rounded-xl py-4 ${isPending ? "bg-jungle-300" : "bg-jungle-500"}`}
        onPress={handleSubmit}
        disabled={isPending}
      >
        <Text className="text-center text-base font-semibold text-white">
          {isPending
            ? photoUris.length > 0
              ? "Uploading photos..."
              : "Completing..."
            : "Complete & Earn XP"}
        </Text>
      </Pressable>
    </ScrollView>

      <XpToast
        points={xpToast ?? 0}
        coins={0}
        visible={xpToast !== null}
        onDismiss={dismissToast}
      />
    </>
  );
}
