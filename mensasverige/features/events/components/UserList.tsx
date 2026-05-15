import React from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { User } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PressableUser from '@/features/account/components/PressableUser';
import { createEventCardStyles } from '../styles/eventCardStyles';

const VISIBLE_LIMIT = 6;

interface UserListProps {
  users: User[];
  title: string;
  fallbackData?: Array<{ userId: string | number; fullName?: string }>;
}

const UserList: React.FC<UserListProps> = ({
  users,
  title,
  fallbackData = [],
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createEventCardStyles(colorScheme ?? 'light');

  if (users.length === 0 && fallbackData.length === 0) {
    return null;
  }

  const hasOverflow = users.length > VISIBLE_LIMIT;
  const sorted = [...users].sort((a, b) => {
    const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim().toLowerCase();
    const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });
  const visibleUsers = showAll ? sorted : sorted.slice(0, VISIBLE_LIMIT);

  const userRows = users.length > 0 ? (
    <View style={styles.userListContainer}>
      {visibleUsers.map((user, index) => (
        <View key={user.userId || index} style={styles.userListGridItem}>
          <PressableUser
            userId={user.userId}
            firstName={user.firstName}
            lastName={user.lastName}
            avatar_url={user.avatar_url}
            avatarSize="xs"
          />
        </View>
      ))}
    </View>
  ) : (
    fallbackData.length > 0 ? (
      <View style={styles.hostsSection}>
        {fallbackData.map((item, index) => (
          <ThemedText key={index}>{item.fullName || `${title} ${index + 1}`}</ThemedText>
        ))}
      </View>
    ) : null
  );

  if (!userRows) return null;

  return (
    <View style={styles.hostsSection}>
      <View style={styles.userListHeaderRow}>
        <ThemedText type='subtitle'>
          {users.length > 0 ? `${title} (${users.length})` : title}
        </ThemedText>
        {hasOverflow && (
          <Pressable onPress={() => setShowAll(v => !v)} hitSlop={8} style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>
              {showAll ? 'Visa färre' : 'Visa alla'}
            </ThemedText>
            <IconSymbol
              name="chevron.right"
              size={18}
              weight="medium"
              color={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'}
              style={{ transform: [{ rotate: showAll ? '270deg' : '90deg' }] }}
            />
          </Pressable>
        )}
      </View>
      {userRows}
    </View>
  );
};

export default UserList;
