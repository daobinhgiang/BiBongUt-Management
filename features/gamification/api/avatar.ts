import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { profileKeys } from "./profile";

async function pickAndUploadAvatar(memberId: string): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled) throw new Error("cancelled");

  const asset = result.assets[0];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = asset.uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: asset.mimeType ?? `image/${ext}`,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Append cache-buster so the image refreshes
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("family_members")
    .update({ avatar_url: avatarUrl })
    .eq("id", memberId);

  if (updateError) throw updateError;

  return avatarUrl;
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => pickAndUploadAvatar(memberId),
    onSuccess: (_url, memberId) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.member(memberId),
      });
    },
  });
}
