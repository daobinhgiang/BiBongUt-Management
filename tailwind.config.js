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
    extend: {
      colors: {
        jungle: {
          50: '#f0f2ec',
          100: '#dde2d3',
          200: '#c5ccb1',
          300: '#a8b38a',
          400: '#9aa87e',
          500: '#819067',
          600: '#6b7a54',
          700: '#566341',
          800: '#414c2f',
          900: '#2c351f',
        },
        bark: {
          50: '#f5f2ea',
          100: '#e2dcc9',
          200: '#d4cdb5',
          300: '#b3a56f',
          400: '#9e9055',
          500: '#807200',
          600: '#6b5f00',
          700: '#554c00',
          800: '#403900',
          900: '#2b2600',
        },
      },
    },
  },
  plugins: [],
};
