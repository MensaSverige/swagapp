import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UpdateBanner } from '@/features/updateCheck/components/UpdateBanner';
import useStore from '@/features/common/store/store';
import { getFullUrl } from '@/features/common/functions/GetFullUrl';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useStore(state => state.user);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
    <UpdateBanner />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            paddingBottom: insets.bottom,
          },
          default: {
            paddingBottom: insets.bottom
          },
        }),
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Information',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(events)"
        options={{
          title: 'Aktiviteter',
          tabBarIcon: ({ color }) => <MaterialIcons name="local-activity" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Karta',
          tabBarIcon: ({ color }) => <MaterialIcons name="person-pin" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => user?.avatar_url
            ? <Image source={{ uri: getFullUrl(user.avatar_url) }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
            : <MaterialIcons name="account-circle" size={28} color={color} />,
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}
