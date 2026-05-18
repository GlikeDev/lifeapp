import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "SaveSmart",
  slug: "savesmart",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0D0E1A",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.savesmart.app",
    infoPlist: {
      NSCameraUsageDescription: "Для сканирования чеков и штрих-кодов",
      NSPhotoLibraryUsageDescription: "Для загрузки изображений чеков",
    },
  },
  android: {
    package: "com.savesmart.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0D0E1A",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-camera",
    "expo-notifications",
    "expo-secure-store",
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? (["@sentry/react-native"] as const)
      : []),
  ],
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    revenueCatKeyIos: process.env.REVENUECAT_PUBLIC_KEY_IOS,
    revenueCatKeyAndroid: process.env.REVENUECAT_PUBLIC_KEY_ANDROID,
    eas: {
      projectId: "6ec6e16d-1eee-4504-8665-b04598bb59ab",
    },
  },
});
