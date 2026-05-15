import React from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { User } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PressableUser, { AvatarSize } from '@/features/account/components/PressableUser';
import UserAvatar from '@/features/map/components/UserAvatar';
import { Colors } from '../../../constants/Colors';
import { createEventCardStyles } from '../styles/eventCardStyles';

const COMPACT_VISIBLE = 5;

interface UserListProps {
  users: User[];
  title: string;
  fallbackData?: Array<{ userId: string | number; fullName?: string }>;
  alwaysExpanded?: boolean;
  gridAvatarSize?: AvatarSize;
}

const UserList: React.FC<UserListProps> = ({
  users,
  title,
  fallbackData = [],
  alwaysExpanded = false,
  gridAvatarSize = 'xs',
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = createEventCardStyles(colorScheme ?? 'light');
  const colors = (colorScheme === 'dark' ? Colors.dark : Colors.light);

  if (users.length === 0 && fallbackData.length === 0) {
    return null;
  }

  const sorted = [...users].sort((a, b) => {
    const nameA = `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim().toLowerCase();
    const nameB = `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const compactUsers = [...sorted]
    .sort((a, b) => (b.avatar_url ? 1 : 0) - (a.avatar_url ? 1 : 0))
    .slice(0, COMPACT_VISIBLE);
  const overflowCount = sorted.length - COMPACT_VISIBLE;

  const compactRow = (
    <Pressable style={styles.compactAvatarRow} onPress={() => setShowAll(true)}>
      {compactUsers.map((user, index) => (
        <View
          key={user.userId || index}
          style={[
            styles.compactAvatarRing,
            { marginLeft: index === 0 ? 0 : -10, backgroundColor: colors.background },
          ]}
        >
          <UserAvatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatar_url={user.avatar_url}
            avatarSize="md"
          />
        </View>
      ))}
      {overflowCount > 0 && (
        <View
          style={[
            styles.compactAvatarRing,
            { marginLeft: -10, backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.compactOverflowBadge,
              { backgroundColor: isDark ? colors.coolGray700 : colors.coolGray200 },
            ]}
          >
            <ThemedText style={styles.compactOverflowText}>+ {overflowCount}</ThemedText>
          </View>
        </View>
      )}
    </Pressable>
  );

  const gridRows = (
    <View style={styles.userListContainer}>
      {sorted.map((user, index) => (
        <View key={user.userId || index} style={styles.userListGridItem}>
          <PressableUser
            userId={user.userId}
            firstName={user.firstName}
            lastName={user.lastName}
            avatar_url={user.avatar_url}
            avatarSize={gridAvatarSize}
          />
        </View>
      ))}
    </View>
  );

  const fallbackRows = users.length === 0 && fallbackData.length > 0 ? (
    <View style={styles.hostsSection}>
      {fallbackData.map((item, index) => (
        <ThemedText key={item.userId ?? index}>{item.fullName || `${title} ${index + 1}`}</ThemedText>
      ))}
    </View>
  ) : null;

  const content = users.length > 0
    ? (alwaysExpanded || showAll ? gridRows : compactRow)
    : fallbackRows;

  if (!content) return null;

  return (
    <View style={styles.hostsSection}>
      <View style={styles.userListHeaderRow}>
        <ThemedText type='subtitle'>
          {title}
        </ThemedText>
        {!alwaysExpanded && users.length > 0 && (
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
      {content}
    </View>
  );
};

export default UserList;
