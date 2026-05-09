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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HandWaving,
  House,
  Link as LinkIcon,
  UsersThree,
  Smiley,
  Ticket,
  CaretLeft,
} from "phosphor-react-native";

import { useSession } from "@/lib/auth/ctx";
import { createFamily, joinFamily } from "@/features/families";

type Mode = "choose" | "create" | "join";

const createSchema = z.object({
  familyName: z.string().min(1, "Family name is required").trim(),
  nickname: z.string().min(1, "Nickname is required").trim(),
});

const joinSchema = z.object({
  inviteCode: z
    .string()
    .uuid("Enter a valid invite code")
    .trim(),
  nickname: z.string().min(1, "Nickname is required").trim(),
});

type CreateForm = z.infer<typeof createSchema>;
type JoinForm = z.infer<typeof joinSchema>;

export default function FamilySetupScreen() {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("choose");
  const [error, setError] = useState<string | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { familyName: "", nickname: "" },
  });

  const joinForm = useForm<JoinForm>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: "", nickname: "" },
  });

  const handleCreate = async (data: CreateForm) => {
    setError(null);
    try {
      await createFamily({
        name: data.familyName,
        nickname: data.nickname,
      });
      queryClient.invalidateQueries({ queryKey: ["my-family"] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create family");
    }
  };

  const handleJoin = async (data: JoinForm) => {
    setError(null);
    try {
      await joinFamily({
        inviteCode: data.inviteCode,
        nickname: data.nickname,
      });
      queryClient.invalidateQueries({ queryKey: ["my-family"] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join family");
    }
  };

  const isSubmitting =
    createForm.formState.isSubmitting || joinForm.formState.isSubmitting;

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="mb-2 flex-row items-center gap-2">
          <HandWaving size={32} color="#f59e0b" weight="duotone" />
          <Text className="text-3xl font-bold text-gray-900">
            Welcome to BiBongUt
          </Text>
        </View>
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
                className="w-full flex-row items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 active:bg-blue-700"
                onPress={() => switchMode("create")}
              >
                <House size={20} color="#fff" weight="bold" />
                <Text className="text-base font-semibold text-white">
                  Create a Family
                </Text>
              </Pressable>

              <Pressable
                className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-blue-600 bg-white py-3.5 active:bg-blue-50"
                onPress={() => switchMode("join")}
              >
                <LinkIcon size={20} color="#2563eb" weight="bold" />
                <Text className="text-base font-semibold text-blue-600">
                  Join with Invite Code
                </Text>
              </Pressable>
            </>
          )}

          {mode === "create" && (
            <>
              <View>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <UsersThree size={14} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700">
                    Family Name
                  </Text>
                </View>
                <Controller
                  control={createForm.control}
                  name="familyName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                      placeholder="e.g. The Dao Family"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoFocus
                    />
                  )}
                />
                {createForm.formState.errors.familyName && (
                  <Text className="mt-1 text-sm text-red-500">
                    {createForm.formState.errors.familyName.message}
                  </Text>
                )}
              </View>
              <View>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Smiley size={14} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700">
                    Your Nickname
                  </Text>
                </View>
                <Controller
                  control={createForm.control}
                  name="nickname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                      placeholder="e.g. Dad, Mom, Papa"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {createForm.formState.errors.nickname && (
                  <Text className="mt-1 text-sm text-red-500">
                    {createForm.formState.errors.nickname.message}
                  </Text>
                )}
              </View>
              <Pressable
                className={`w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700 ${isSubmitting ? "opacity-50" : ""}`}
                onPress={createForm.handleSubmit(handleCreate)}
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
              <Pressable
                className="flex-row items-center justify-center gap-1"
                onPress={() => switchMode("choose")}
              >
                <CaretLeft size={16} color="#2563eb" />
                <Text className="text-base text-blue-600">Back</Text>
              </Pressable>
            </>
          )}

          {mode === "join" && (
            <>
              <View>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Ticket size={14} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700">
                    Invite Code
                  </Text>
                </View>
                <Controller
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                      placeholder="Paste your invite code"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoFocus
                      autoCapitalize="none"
                    />
                  )}
                />
                {joinForm.formState.errors.inviteCode && (
                  <Text className="mt-1 text-sm text-red-500">
                    {joinForm.formState.errors.inviteCode.message}
                  </Text>
                )}
              </View>
              <View>
                <View className="mb-1 flex-row items-center gap-1.5">
                  <Smiley size={14} color="#374151" />
                  <Text className="text-sm font-medium text-gray-700">
                    Your Nickname
                  </Text>
                </View>
                <Controller
                  control={joinForm.control}
                  name="nickname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                      placeholder="e.g. Kiddo, Junior"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {joinForm.formState.errors.nickname && (
                  <Text className="mt-1 text-sm text-red-500">
                    {joinForm.formState.errors.nickname.message}
                  </Text>
                )}
              </View>
              <Pressable
                className={`w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700 ${isSubmitting ? "opacity-50" : ""}`}
                onPress={joinForm.handleSubmit(handleJoin)}
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
              <Pressable
                className="flex-row items-center justify-center gap-1"
                onPress={() => switchMode("choose")}
              >
                <CaretLeft size={16} color="#2563eb" />
                <Text className="text-base text-blue-600">Back</Text>
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
