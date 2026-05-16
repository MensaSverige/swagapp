import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import useStore from '@/features/common/store/store';
import { getFullUrl } from '@/features/common/functions/GetFullUrl';

const SIDEBAR_WIDTH = 220;
const CONTENT_MAX_WIDTH = 900;
const FULL_BLEED_PATHS = ['/map'];

type NavItem = {
  label: string;
  route: string;
  pathMatch: string;
  icon: (color: string) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Information',
    route: '/(tabs)/(home)',
    pathMatch: '/(home)',
    icon: (color) => <IconSymbol size={20} name="house.fill" color={color} />,
  },
  {
    label: 'Aktiviteter',
    route: '/(tabs)/(events)',
    pathMatch: '/(events)',
    icon: (color) => <MaterialIcons name="local-activity" size={20} color={color} />,
  },
  {
    label: 'Karta',
    route: '/(tabs)/map',
    pathMatch: '/map',
    icon: (color) => <MaterialIcons name="person-pin" size={20} color={color} />,
  },
  {
    label: 'Profil',
    route: '/(tabs)/(profile)',
    pathMatch: '/(profile)',
    icon: (color) => <MaterialIcons name="account-circle" size={20} color={color} />,
  },
];

export function WebSidebarLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const user = useStore((state) => state.user);
  const tint = Colors[isDark ? 'dark' : 'light'].tint;

  const isFullBleed = FULL_BLEED_PATHS.some(p => pathname.startsWith(p));

  const sidebarBg = isDark ? '#0f172a' : '#1e293b';
  const sidebarBorder = isDark ? '#1e293b' : '#334155';
  const contentBg = isDark ? '#0a0f1a' : '#f8f9fb';
  const labelDefault = isDark ? '#94a3b8' : '#94a3b8';
  const labelActive = '#f1f5f9';
  const appNameColor = '#64748b';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)';
  const activeBg = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.10)';

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={[styles.sidebar, { backgroundColor: sidebarBg, borderRightColor: sidebarBorder }]}>
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={[styles.brandText, { color: appNameColor }]}>MENSA</Text>
          <Text style={[styles.brandSub, { color: appNameColor }]}>SVERIGE</Text>
        </View>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.includes(item.pathMatch);
            const iconColor = isActive ? labelActive : labelDefault;

            // Avatar override for Profil
            const iconNode =
              item.pathMatch === '/(profile)' && user?.avatar_url ? (
                <Image
                  source={{ uri: getFullUrl(user.avatar_url) }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                item.icon(iconColor)
              );

            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                style={[
                  styles.navItem,
                  isActive && { backgroundColor: activeBg },
                ]}
                activeOpacity={0.75}
              >
                {/* Active accent bar */}
                <View
                  style={[
                    styles.accentBar,
                    { backgroundColor: isActive ? tint : 'transparent' },
                  ]}
                />
                <View style={styles.navIcon}>{iconNode}</View>
                <Text
                  style={[
                    styles.navLabel,
                    { color: isActive ? labelActive : labelDefault },
                    isActive && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: contentBg }]}>
        {isFullBleed ? (
          <Slot />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.centeredContent}>
              <Slot />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    flexDirection: 'column',
    borderRightWidth: 1,
  },
  brand: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    lineHeight: 14,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 3,
    lineHeight: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  nav: {
    flex: 1,
    paddingTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingRight: 16,
    borderRadius: 0,
    marginBottom: 1,
  },
  accentBar: {
    width: 3,
    height: 20,
    borderRadius: 0,
    marginRight: 16,
  },
  navIcon: {
    width: 22,
    alignItems: 'center',
    marginRight: 12,
  },
  navLabel: {
    fontSize: 13,
    letterSpacing: 0.4,
    fontWeight: '400',
  },
  navLabelActive: {
    fontWeight: '600',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  centeredContent: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    flex: 1,
  },
});
