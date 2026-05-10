import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import UserAvatar, { getOnlineStatusColor } from '@/features/map/components/UserAvatar';
import { OnlineStatus } from '@/features/map/types/userWithLocation';
import { timeUntil } from '@/features/events/utilities/TimeLeft';
import { useColorScheme } from '@/hooks/useColorScheme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type UserListItemProps = {
  firstName?: string | null;
  lastName?: string | null;
  avatar_url?: string | null;
  onlineStatus?: OnlineStatus;
  avatarSize?: AvatarSize;
  timestamp?: string | null;
  pressable?: boolean;
};

const UserListItem: React.FC<UserListItemProps> = ({
  firstName,
  lastName,
  avatar_url,
  onlineStatus = 'offline',
  avatarSize = 'sm',
  timestamp,
  pressable = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const linkColor = colorScheme === 'dark' ? '#4FC1FF' : '#0077E6';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  const displayName = (firstName || lastName)
    ? `${firstName ?? ''} ${lastName ?? ''}`.trim()
    : 'Anonym';

  return (
    <View style={styles.row}>
      <UserAvatar
        firstName={firstName}
        lastName={lastName}
        avatar_url={avatar_url ?? ''}
        onlineStatus={onlineStatus}
        avatarSize={avatarSize}
      />
      <View style={styles.nameContainer}>
        <ThemedText style={[styles.name, pressable && { color: linkColor }]}>{displayName}</ThemedText>
        {timestamp && (
          <ThemedText style={[styles.timestamp, { color: getOnlineStatusColor(onlineStatus, colorScheme) }]}>
            {timeUntil(now, timestamp)} sedan
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
  },
  timestamp: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 1,
  },
});

export default UserListItem;
