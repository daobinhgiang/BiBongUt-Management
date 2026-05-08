import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/lib/auth/ctx";
import { createFamily, joinFamily } from "@/features/families";

type Mode = "choose" | "create" | "join";

export default function FamilySetupScreen() {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!familyName.trim() || !nickname.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createFamily({
        name: familyName.trim(),
        nickname: nickname.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["my-family"] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create family");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !nickname.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await joinFamily({
        inviteCode: inviteCode.trim(),
        nickname: nickname.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["my-family"] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join family");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-2 text-3xl font-bold text-gray-900">
          Welcome to BiBongUt
        </Text>
        <Text className="mb-8 text-base text-gray-500">
          Set up your family to get started
        </Text>

        <View className="w-full max-w-sm gap-4">
          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}

          {mode === "choose" && (
            <>
              <Pressable
                className="w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700"
                onPress={() => setMode("create")}
              >
                <Text className="text-base font-semibold text-white">
                  Create a Family
                </Text>
              </Pressable>

              <Pressable
                className="w-full items-center rounded-lg border border-blue-600 bg-white py-3.5 active:bg-blue-50"
                onPress={() => setMode("join")}
              >
                <Text className="text-base font-semibold text-blue-600">
                  Join with Invite Code
                </Text>
              </Pressable>
            </>
          )}

          {mode === "create" && (
            <>
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Family Name
                </Text>
                <TextInput
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="e.g. The Dao Family"
                  placeholderTextColor="#9ca3af"
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoFocus
                />
              </View>
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Your Nickname
                </Text>
                <TextInput
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="e.g. Dad, Mom, Papa"
                  placeholderTextColor="#9ca3af"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
              <Pressable
                className="w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700"
                onPress={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Create Family
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={() => { setMode("choose"); setError(null); }}>
                <Text className="text-center text-base text-blue-600">Back</Text>
              </Pressable>
            </>
          )}

          {mode === "join" && (
            <>
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Invite Code
                </Text>
                <TextInput
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="Paste your invite code"
                  placeholderTextColor="#9ca3af"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoFocus
                  autoCapitalize="none"
                />
              </View>
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Your Nickname
                </Text>
                <TextInput
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="e.g. Kiddo, Junior"
                  placeholderTextColor="#9ca3af"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
              <Pressable
                className="w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700"
                onPress={handleJoin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-base font-semibold text-white">
                    Join Family
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={() => { setMode("choose"); setError(null); }}>
                <Text className="text-center text-base text-blue-600">Back</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable className="mt-8" onPress={signOut}>
          <Text className="text-sm text-gray-400">Sign out</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
