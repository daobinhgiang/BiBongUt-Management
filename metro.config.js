/**
 * Metro Bundler Configuration
 *
 * Metro is the JavaScript bundler for React Native. This config extends
 * Expo's default Metro config with NativeWind's CSS processing.
 *
 * withNativeWind() wraps Metro to:
 * - Process global.css through Tailwind CSS at build time
 * - Generate platform-specific style objects from Tailwind classes
 * - Auto-generate nativewind-env.d.ts for TypeScript support
 *
 * @see https://www.nativewind.dev/getting-started/metro
 * @see https://docs.expo.dev/guides/customizing-metro/
 * @see https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup (expo-sqlite web: wasm + COOP/COEP)
 */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite wasm is only needed on native; on web we use the browser's localStorage.

const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

// SharedArrayBuffer (required by wa-sqlite) needs these headers on the document HTML response.
const previousEnhanceMiddleware = nativeWindConfig.server?.enhanceMiddleware;
nativeWindConfig.server = {
  ...nativeWindConfig.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const inner = previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, metroServer)
      : middleware;
    return (req, res, next) => {
      res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      return inner(req, res, next);
    };
  },
};

module.exports = nativeWindConfig;
