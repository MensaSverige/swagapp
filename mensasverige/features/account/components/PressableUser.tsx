import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import UserListItem from './UserListItem';
import { OnlineStatus } from '@/features/map/types/userWithLocation';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type PressableUserProps = {
  userId?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar_url?: string | null;
  onlineStatus?: OnlineStatus;
  avatarSize?: AvatarSize;
  timestamp?: string | null;
};

const PressableUser: React.FC<PressableUserProps> = ({
  userId,
  firstName,
  lastName,
  avatar_url,
  onlineStatus,
  avatarSize,
  timestamp,
}) => {
  const router = useRouter();

  const item = (
    <UserListItem
      firstName={firstName}
      lastName={lastName}
      avatar_url={avatar_url}
      onlineStatus={onlineStatus}
      avatarSize={avatarSize}
      timestamp={timestamp}
      pressable={!!userId}
    />
  );

  if (!userId) return item;

  return (
    <TouchableOpacity
      onPress={() => router.navigate({ pathname: '/profile/[userId]', params: { userId: String(userId) } })}
      activeOpacity={0.7}
    >
      {item}
    </TouchableOpacity>
  );
};

export default PressableUser;
