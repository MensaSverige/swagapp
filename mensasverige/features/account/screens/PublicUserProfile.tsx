import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import UserAvatar from '@/features/map/components/UserAvatar';
import { User } from '../../../api_schema/types';
import { getUserById, getInterestCategories } from '../services/userService';
import { InterestCategory } from '../constants/interests';

type Props = { userId: number };

const PublicUserProfile: React.FC<Props> = ({ userId }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<InterestCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'forbidden' | 'not_found' | 'error'>('loading');

  useEffect(() => {
    Promise.all([getUserById(userId), getInterestCategories()])
      .then(([data, cats]) => {
        setUser(data);
        setCategories(cats);
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

  const userInterests: string[] = (user as any).interests ?? [];
  const interestCategories = categories
    .map(cat => ({ ...cat, items: cat.items.filter(i => userInterests.includes(i)) }))
    .filter(cat => cat.items.length > 0);
  const hasInterests = interestCategories.length > 0;

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
        </View>

        {/* Contact info */}
        {hasContact && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Kontaktuppgifter</ThemedText>
            {hasEmail && (
              <View style={styles.contactRow}>
                <MaterialIcons name="email" size={18} color={Colors.coolGray500} />
                <ThemedText style={styles.contactText}>{user.contact_info!.email}</ThemedText>
              </View>
            )}
            {hasPhone && (
              <View style={styles.contactRow}>
                <MaterialIcons name="phone" size={18} color={Colors.coolGray500} />
                <ThemedText style={styles.contactText}>{user.contact_info!.phone}</ThemedText>
              </View>
            )}
          </ThemedView>
        )}

        {/* Interests */}
        {hasInterests && (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.cardLabel}>Intressen</ThemedText>
            {interestCategories.map(cat => (
              <View key={cat.category} style={styles.categoryBlock}>
                <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
                <View style={styles.chipsRow}>
                  {cat.items.map(item => (
                    <View key={item} style={[styles.chip, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                      <ThemedText style={styles.chipText}>{item}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.5,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  contactText: {
    fontSize: 15,
    flex: 1,
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
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 13,
  },
});

export default PublicUserProfile;
