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

import { useSession } from "@/lib/auth/ctx";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signInWithEmail } = useSession();
  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    }
  };

  const submitForm = handleSubmit(onSubmit);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-2 text-3xl font-bold text-gray-900">
          {"🏠 BiBongUt"}
        </Text>
        <Text className="mb-8 text-base text-gray-500">
          Sign in to your family
        </Text>

        <View className="w-full max-w-sm gap-4">
          {error && (
            <View className="rounded-lg bg-red-50 px-4 py-3">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}

          <View>
            <Text className="mb-1 text-sm font-medium text-gray-700">
              {"📧 Email"}
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
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
            <Text className="mb-1 text-sm font-medium text-gray-700">
              {"🔒 Password"}
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  ref={passwordRef}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
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
            {errors.password && (
              <Text className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </Text>
            )}
          </View>

          <Pressable
            className={`mt-2 w-full items-center rounded-lg bg-blue-600 py-3.5 active:bg-blue-700 ${isSubmitting ? "opacity-50" : ""}`}
            onPress={submitForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Sign In
              </Text>
            )}
          </Pressable>
        </View>

        <Link href="/(auth)/signup" asChild>
          <Pressable className="mt-6">
            <Text className="text-base text-blue-600">
              Don&apos;t have an account? Sign up
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
