/**
 * Babel Configuration
 *
 * babel-preset-expo includes all necessary transforms for Expo/React Native:
 * - JSX transform (React 19 automatic runtime)
 * - Reanimated plugin (included automatically by Expo)
 * - Platform-specific module resolution
 *
 * NativeWind v4 does NOT require a separate babel plugin — all CSS processing
 * is handled by Metro via withNativeWind() in metro.config.js.
 *
 * @see https://docs.expo.dev/versions/latest/config/babel/
 */
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
