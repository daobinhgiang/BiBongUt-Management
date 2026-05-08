/**
 * Babel Configuration
 *
 * babel-preset-expo includes all necessary transforms for Expo/React Native:
 * - JSX transform (React 19 automatic runtime)
 * - Reanimated plugin (included automatically by Expo)
 * - Platform-specific module resolution
 *
 * NativeWind v4 requires both the jsxImportSource and nativewind/babel preset
 * for className props to map to Tailwind CSS classes on all platforms.
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
