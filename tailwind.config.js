/**
 * Tailwind CSS Configuration for NativeWind v4
 *
 * NativeWind uses Tailwind CSS to generate styles for React Native.
 * This config tells Tailwind which files to scan for class names
 * and applies the NativeWind preset for RN compatibility.
 *
 * - content: Directories scanned for Tailwind class usage (purges unused styles in production)
 * - presets: NativeWind preset maps Tailwind utilities to React Native style properties
 * - theme.extend: Add custom colors, spacing, fonts etc. here
 *
 * @see https://www.nativewind.dev/getting-started/tailwind-css
 * @see https://tailwindcss.com/docs/configuration
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
