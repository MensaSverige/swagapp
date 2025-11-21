import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";
  const appEnvironment = process.env.APP_ENV || "development";

  // Base configuration from your app.json
  const baseConfig: ExpoConfig = {
    name: "mensasverige",
    slug: "mensasverige",
    version: "2.0.1",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      fallbackToCacheTimeout: 2000,
      url: "https://u.expo.dev/ba3ea4a2-fed7-462a-b42c-70092682f176",
    },
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mensasverige",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "se.mensasverige",
      appleTeamId: "295VA2R9VV",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Din platsinformation används för att visa din position för andra användare. Varje platsuppdatering lagras i upp till en timme.",
        NSLocationAlwaysUsageDescription:
          "Din platsinformation används för att visa din position för andra användare. Varje platsuppdatering lagras i upp till en timme.",
        NSLocationUsageDescription:
          "Din platsinformation används för att visa din position för andra användare. Varje platsuppdatering lagras i upp till en timme.",
        NSLocationWhenInUseUsageDescription:
          "Din platsinformation används för att visa din position för andra användare. Varje platsuppdatering lagras i upp till en timme.",
        NSPhotoLibraryUsageDescription:
          "Bildgalleriet används för att visa dig bilder så du kan välja profilbild för uppladdning. Bara den bild du väljer används av appen.",
      },
      icon: "./assets/images/icon_fill.png",
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: "./assets/images/adaptive-icon.png",
      //   backgroundColor: "#ffffff"
      // },
      edgeToEdgeEnabled: true,
      package: "se.mensasverige",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
          iOSGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with your friends."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "ba3ea4a2-fed7-462a-b42c-70092682f176",
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      environment: appEnvironment,
      isProduction,
      isDevelopment,
    },
    owner: "mensasverige",
  };

  // Environment-specific overrides
  switch (appEnvironment) {
    case "production":
      return {
        ...baseConfig,
        name: "Mensa Sverige",
        // You can override any config for production
        extra: {
          ...baseConfig.extra,
          enableAnalytics: true,
          debugMode: false,
        },
      };
    case "preview":
      return {
        ...baseConfig,
        name: "Mensa Sverige (Preview)",
        //slug: "mensasverige-preview",
        android: {
          ...baseConfig.android,
          package: "se.mensasverige.preview",
        },
        ios: {
          ...baseConfig.ios,
          bundleIdentifier: "se.mensasverige.preview",
        },
        extra: {
          ...baseConfig.extra,
          enableAnalytics: false,
          debugMode: true,
        },
      };
    case "development":
    default:
      return {
        ...baseConfig,
        name: "Mensa Sverige (Dev)",
        //slug: "mensasverige-dev",
        android: {
          ...baseConfig.android,
          package: "se.mensasverige.dev",
        },
        ios: {
          ...baseConfig.ios,
          bundleIdentifier: "se.mensasverige.dev",
          infoPlist: {
            ...baseConfig.ios?.infoPlist,
            NSAppTransportSecurity: {
              ...baseConfig.ios?.infoPlist?.NSAppTransportSecurity,
              NSAllowsArbitraryLoads: false,
              NSExceptionDomains: {
                ...baseConfig.ios?.infoPlist?.NSAppTransportSecurity
                  ?.NSExceptionDomains,
                localhost: {
                  NSExceptionAllowsInsecureHTTPLoads: true,
                }
              },
            },
          },
        },
        extra: {
          ...baseConfig.extra,
          enableAnalytics: false,
          debugMode: true,
        },
      };
  }
};
