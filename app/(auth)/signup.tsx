import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Envelope, Lock } from "phosphor-react-native";
import { Image } from "expo-image";

import { useSession } from "@/lib/auth/ctx";

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const { signUpWithEmail } = useSession();
  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const confirmPasswordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupForm) => {
    setError(null);
    try {
      await signUpWithEmail(data.email, data.password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign up failed");
    }
  };

  const submitForm = handleSubmit(onSubmit);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-bark-50 px-6">
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 120, height: 120 }}
          contentFit="contain"
        />
        <Text className="mt-2 text-3xl font-bold text-jungle-800">
          Join BiBongUt
        </Text>
        <Text className="mb-8 text-base text-gray-500">
          Create your account
        </Text>

        <View className="w-full max-w-sm gap-4">
          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}

          <View>
            <View className="mb-1 flex-row items-center gap-1.5">
              <Envelope size={14} color="#6b7a54" />
              <Text className="text-sm font-medium text-gray-700">Email</Text>
            </View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="w-full rounded-lg border border-bark-200 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="you@example.com"
                  placeholderTextColor="#b3a56f"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View>
            <View className="mb-1 flex-row items-center gap-1.5">
              <Lock size={14} color="#6b7a54" />
              <Text className="text-sm font-medium text-gray-700">
                Password
              </Text>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={passwordRef}
                  className="w-full rounded-lg border border-bark-200 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="At least 6 characters"
                  placeholderTextColor="#b3a56f"
                  secureTextEntry
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </Text>
            )}
          </View>

          <View>
            <View className="mb-1 flex-row items-center gap-1.5">
              <Lock size={14} color="#6b7a54" />
              <Text className="text-sm font-medium text-gray-700">
                Confirm Password
              </Text>
            </View>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={confirmPasswordRef}
                  className="w-full rounded-lg border border-bark-200 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="Re-enter your password"
                  placeholderTextColor="#b3a56f"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (!isSubmitting) submitForm();
                  }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          <Pressable
            className={`mt-2 w-full items-center rounded-lg bg-jungle-500 py-3.5 active:bg-jungle-600 ${isSubmitting ? "opacity-50" : ""}`}
            onPress={submitForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Create Account
              </Text>
            )}
          </Pressable>
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-6">
            <Text className="text-base text-jungle-600">
              Already have an account? Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
