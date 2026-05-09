import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { supabase } from "@/lib/supabase";

const MAX_WIDTH = 1920;
const COMPRESSION = 0.8;

// ── Compress a single image ──
async function compressImage(uri: string): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: COMPRESSION, format: SaveFormat.JPEG },
  );
  return result.uri;
}

// ── Upload a single photo to Supabase Storage ──
async function uploadPhoto(
  uri: string,
  familyId: string,
  itemId: string,
): Promise<string> {
  const compressedUri = await compressImage(uri);

  // Use fetch+blob pattern (proven in avatar upload, works on all platforms)
  const response = await fetch(compressedUri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const filePath = `${familyId}/${itemId}/${fileName}`;

  const { error } = await supabase.storage
    .from("bucket-list-photos")
    .upload(filePath, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  return filePath;
}

// ── Pick multiple images ──
export async function pickImages(selectionLimit = 10) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit,
    orderedSelection: true,
    quality: 1,
  });

  if (result.canceled) return [];
  return result.assets.map((a) => a.uri);
}

// ── Upload multiple photos, returns storage paths ──
export async function uploadPhotos(
  uris: string[],
  familyId: string,
  itemId: string,
): Promise<string[]> {
  const paths = await Promise.all(
    uris.map((uri) => uploadPhoto(uri, familyId, itemId)),
  );
  return paths;
}

// ── Get public URL for a storage path ──
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from("bucket-list-photos")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
