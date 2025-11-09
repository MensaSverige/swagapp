import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const defaultHeaderOptions = {
    headerRight: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
        <TouchableOpacity
          style={{ padding: 12 }}
          onPress={() => {
            router.push('/(tabs)/settings');
          }}>
          <MaterialIcons name="settings" size={28} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
      </View>
    ),
  };
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
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
          ...defaultHeaderOptions,

        }}
      />
      <Tabs.Screen
        name="schedule"
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
        name="settings"
        options={{
          title: 'Inställningar',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
          //href: null, // This hides the tab from the tab bar
          headerShown: true, // Show header on settings screen
        }}
      />
    </Tabs>
  );
}
