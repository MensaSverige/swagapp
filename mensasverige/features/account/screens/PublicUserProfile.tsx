import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import UserAvatar from '@/features/map/components/UserAvatar';
import { User, ProfileOptionCategory } from '../../../api_schema/types';
import { getUserById, getInterestCategories, getProfileOptions } from '../services/userService';
import { InterestCategory } from '../constants/interests';
import { findOption } from '../constants/profileOptions';
import useStore from '../../common/store/store';
import InterestsCard from '../components/InterestsCard';

type Props = { userId: number };

function computeAge(birthdate: string): number {
  const today = new Date();
  const bd = new Date(birthdate);
  let age = today.getFullYear() - bd.getFullYear();
  if (today < new Date(today.getFullYear(), bd.getMonth(), bd.getDate())) age--;
  return age;
}

const PublicUserProfile: React.FC<Props> = ({ userId }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);
  const { user: currentUser } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<InterestCategory[]>([]);
  const [profileOptionCategories, setProfileOptionCategories] = useState<ProfileOptionCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'forbidden' | 'not_found' | 'error'>('loading');

  useEffect(() => {
    Promise.all([getUserById(userId), getInterestCategories(), getProfileOptions()])
      .then(([data, cats, opts]) => {
        setUser(data);
        setCategories(cats);
        setProfileOptionCategories(opts);
        setStatus('loaded');
      })
      .catch((err: any) => {
        const code = err?.response?.status;
        if (code === 403) setStatus('forbidden');
        else if (code === 404) setStatus('not_found');
        else setStatus('error');
      });
  }, [userId]);

  if (status === 'loading') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </ThemedView>
    );
  }

  if (status === 'forbidden') {
    return (
      <ThemedView style={styles.centered}>
        <MaterialIcons name="lock" size={48} color={Colors.coolGray400} />
        <ThemedText style={styles.emptyText}>Den här profilen är inte synlig för dig</ThemedText>
      </ThemedView>
    );
  }

  if (status === 'not_found' || status === 'error' || !user) {
    return (
      <ThemedView style={styles.centered}>
        <MaterialIcons name="person-off" size={48} color={Colors.coolGray400} />
        <ThemedText style={styles.emptyText}>Användaren hittades inte</ThemedText>
      </ThemedView>
    );
  }

  const hasEmail = !!user.contact_info?.email;
  const hasPhone = !!user.contact_info?.phone;
  const hasContact = hasEmail || hasPhone;

  const age = user.birthdate ? computeAge(user.birthdate) : null;

  const userInterests = user.interests ?? [];
  const currentUserInterests = currentUser?.interests ?? [];

  const sharedInterests = userInterests.filter(i => currentUserInterests.includes(i));
  const hasSharedInterests = sharedInterests.length > 0;

  const allInterestCategories = categories
    .map(cat => ({ ...cat, items: cat.items.filter(i => userInterests.includes(i)) }))
    .filter(cat => cat.items.length > 0);

  const nonSharedCategories = categories
    .map(cat => ({ ...cat, items: cat.items.filter(i => userInterests.includes(i) && !sharedInterests.includes(i)) }))
    .filter(cat => cat.items.length > 0);

  const hasInterests = userInterests.length > 0;

  const getCategoryItems = (key: string) =>
    profileOptionCategories.find(c => c.key === key)?.items ?? [];

  const identityItems = [
    { key: 'gender', val: user.gender },
    { key: 'sexuality', val: user.sexuality },
    { key: 'relationship_style', val: user.relationship_style },
    { key: 'relationship_status', val: user.relationship_status },
  ].flatMap(({ key, val }) => {
    const found = findOption(getCategoryItems(key), val);
    return found ? [found] : [];
  });
  const hasIdentity = identityItems.length > 0;

  const visibleSocialFlags = getCategoryItems('social_flags').filter(o =>
    (user.social_flags ?? []).includes(o.value)
  );
  const hasSocialFlags = visibleSocialFlags.length > 0;

  const displayName = (user.firstName || user.lastName)
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    : 'Anonym';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatar_url={user.avatar_url}
            avatarSize="2xl"
            onlineStatus="offline"
          />
          <ThemedText type="title" style={styles.name}>{displayName}</ThemedText>
          {user.slogan ? (
            <ThemedText style={styles.slogan}>{user.slogan}</ThemedText>
          ) : null}
          {(user.hometown || age !== null) && (
            <View style={styles.heroMeta}>
              {user.hometown ? (
                <View style={styles.heroMetaItem}>
                  <MaterialIcons name="home" size={14} color={Colors.coolGray400} />
                  <ThemedText style={styles.heroMetaText}>{user.hometown}</ThemedText>
                </View>
              ) : null}
              {age !== null ? (
                <View style={styles.heroMetaItem}>
                  <MaterialIcons name="cake" size={14} color={Colors.coolGray400} />
                  <ThemedText style={styles.heroMetaText}>{age} år</ThemedText>
                </View>
              ) : null}
            </View>
          )}
        </View>
        {/* Identity */}
        {hasIdentity && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Identitet & relation</ThemedText>
            <View style={styles.identityGrid}>
              {identityItems.map(item => (
                <View key={item.value} style={styles.identityItem}>
                  <MaterialIcons name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']} size={16} color={isDark ? Colors.coolGray400 : Colors.warmGray400} />
                  <ThemedText style={styles.identityItemText}>{item.label}</ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}
        {/* Interests */}
        {hasInterests && (
          <InterestsCard
            sharedInterests={sharedInterests}
            nonSharedCategories={nonSharedCategories}
            allInterestCategories={allInterestCategories}
            hasSharedInterests={hasSharedInterests}
            isDark={isDark}
          />
        )}
        {/* Contact info */}
        {hasContact && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Kontakt</ThemedText>
            {hasEmail && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  Linking.openURL(`mailto:${user.contact_info?.email}`);
                }}
              >
                <MaterialIcons name="email" size={18} color={Colors.warmGray400} />
                <ThemedText style={styles.contactText}>{user.contact_info!.email}</ThemedText>
              </TouchableOpacity>
            )}
            {hasPhone && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  Linking.openURL(`tel:${user.contact_info?.phone}`);
                }}
              >
                <MaterialIcons name="phone" size={18} color={Colors.green500} />
                <ThemedText style={styles.contactText}>{user.contact_info!.phone}</ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}


      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) => {
  const linkColor = isDark ? Colors.dark.primary500 : Colors.light.primary500;
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },
    emptyText: {
      textAlign: 'center',
      opacity: 0.6,
      fontSize: 15,
    },
    hero: {
      alignItems: 'center',
      paddingBottom: 24,
    },
    name: {
      textAlign: 'center',
      marginTop: 12,
    },
    slogan: {
      marginTop: 6,
      fontSize: 14,
      opacity: 0.65,
      textAlign: 'center',
    },
    heroMeta: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    heroMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    heroMetaText: {
      fontSize: 13,
      opacity: 0.6,
    },
    card: {
      //borderRadius: 12,
      padding: 16,
      //marginBottom: 8,
      //shadowOpacity: 0.05,
      //elevation: 1,
    },
    cardLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      opacity: 0.5,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 10,
    },
    contactText: {
      fontSize: 15,
      flex: 1,
      color: linkColor,
    },
    categoryBlock: {
      marginBottom: 12,
    },
    categoryTitle: {
      fontSize: 13,
      marginBottom: 6,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipText: {
      fontSize: 13,
    },
    otherChip: {
      backgroundColor: isDark ? Colors.coolGray700 : Colors.coolGray100,
    },
    identityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    identityItem: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    identityItemText: {
      fontSize: 14,
      flexShrink: 1,
    },
    socialChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    sharedChip: {
      backgroundColor: isDark ? Colors.backgroundDarkInfo : Colors.primary50,
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.primary600 : Colors.primary300,
    },
    interestSectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      opacity: 0.5,
      marginBottom: 8,
      marginTop: 4,
    },
    showMoreButton: {
      marginTop: 10,
      alignSelf: 'center',
    },
    showMoreText: {
      fontSize: 13,
      opacity: 0.55,
    },
    nonSharedSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
  });
};

export default PublicUserProfile;
