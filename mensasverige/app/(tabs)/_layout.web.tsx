import React from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UpdateBanner } from '@/features/updateCheck/components/UpdateBanner';
import { ThemedText } from '@/components/ThemedText';
import { WebSidebarLayout } from '@/components/WebSidebarLayout';
import useStore from '@/features/common/store/store';
import { getFullUrl } from '@/features/common/functions/GetFullUrl';

const DESKTOP_BREAKPOINT = 768;

const NAV_ITEMS = [
  {
    label: 'Information',
    route: '/(tabs)/(home)',
    pathMatch: '/(home)',
    icon: (color: string) => <IconSymbol size={24} name="house.fill" color={color} />,
  },
  {
    label: 'Aktiviteter',
    route: '/(tabs)/(events)',
    pathMatch: '/(events)',
    icon: (color: string) => <MaterialIcons name="local-activity" size={24} color={color} />,
  },
  {
    label: 'Karta',
    route: '/(tabs)/map',
    pathMatch: '/map',
    icon: (color: string) => <MaterialIcons name="person-pin" size={24} color={color} />,
  },
  {
    label: 'Profil',
    route: '/(tabs)/(profile)',
    pathMatch: '/(profile)',
    icon: (color: string) => <MaterialIcons name="account-circle" size={24} color={color} />,
  },
];

function MobileWebTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tint = Colors[isDark ? 'dark' : 'light'].tint;
  const insets = useSafeAreaInsets();
  const user = useStore(state => state.user);

  const bg = isDark ? '#111827' : '#ffffff';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: bg,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
      paddingBottom: insets.bottom,
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = pathname.includes(item.pathMatch);
        const color = isActive ? tint : inactiveColor;
        const iconNode = item.pathMatch === '/(profile)' && user?.avatar_url
          ? <Image
              source={{ uri: getFullUrl(user.avatar_url) }}
              style={{ width: 24, height: 24, borderRadius: 12 }}
              contentFit="cover"
            />
          : item.icon(color);

        return (
          <TouchableOpacity
            key={item.route}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}
            onPress={() => router.navigate(item.route as any)}
          >
            {iconNode}
            <ThemedText style={{ fontSize: 11, color, marginTop: 2 }}>{item.label}</ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function WebTabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  if (isDesktop) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <UpdateBanner />
        <WebSidebarLayout />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <UpdateBanner />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <MobileWebTabBar />
    </SafeAreaView>
  );
}
