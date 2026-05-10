import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import UserAvatar from '@/features/map/components/UserAvatar';
import { OnlineStatus } from '@/features/map/types/userWithLocation';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type UserListItemProps = {
  firstName?: string | null;
  lastName?: string | null;
  avatar_url?: string | null;
  onlineStatus?: OnlineStatus;
  avatarSize?: AvatarSize;
};

const UserListItem: React.FC<UserListItemProps> = ({
  firstName,
  lastName,
  avatar_url,
  onlineStatus = 'offline',
  avatarSize = 'sm',
}) => {
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
      <ThemedText style={styles.name}>{displayName}</ThemedText>
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
  name: {
    fontSize: 15,
    flex: 1,
  },
});

export default UserListItem;
