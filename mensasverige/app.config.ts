import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const appEnvironment = process.env.APP_ENV || 'development';
  
  // Base configuration from your app.json
  const baseConfig: ExpoConfig = {
    name: "mensasverige",
    slug: "mensasverige",
    version: "1.0.0",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/ba3ea4a2-fed7-462a-b42c-70092682f176"
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mensasverige",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: "./assets/images/adaptive-icon.png",
      //   backgroundColor: "#ffffff"
      // },
      edgeToEdgeEnabled: true,
      package: "se.mensasverige"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      ],
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "ba3ea4a2-fed7-462a-b42c-70092682f176"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      environment: appEnvironment,
      isProduction,
      isDevelopment,
    },
    owner: "mensasverige"
  };

  // Environment-specific overrides
  switch (appEnvironment) {
    case 'production':
      return {
        ...baseConfig,
        name: "Mensa Sverige",
        // You can override any config for production
        extra: {
          ...baseConfig.extra,
          enableAnalytics: true,
          debugMode: false,
        }
      };
      case 'preview':
      return {
        ...baseConfig,
        name: "Mensa Sverige (Preview)",
        //slug: "mensasverige-preview",
        android: {
          ...baseConfig.android,
          package: "se.mensasverige.preview"
        },
        extra: {
          ...baseConfig.extra,
          enableAnalytics: false,
          debugMode: true,
        }
      }; 
    case 'development':
    default:
      return {
        ...baseConfig,
        name: "Mensa Sverige (Dev)",
        //slug: "mensasverige-dev",
        android: {
          ...baseConfig.android,
          package: "se.mensasverige.dev"
        },
        extra: {
          ...baseConfig.extra,
          enableAnalytics: false,
          debugMode: true,
        }
      };
  }
};
