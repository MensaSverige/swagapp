import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import UserListItem from './UserListItem';
import { OnlineStatus } from '@/features/map/types/userWithLocation';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type PressableUserProps = {
  userId: number;
  firstName?: string | null;
  lastName?: string | null;
  avatar_url?: string | null;
  onlineStatus?: OnlineStatus;
  avatarSize?: AvatarSize;
};

const PressableUser: React.FC<PressableUserProps> = ({
  userId,
  firstName,
  lastName,
  avatar_url,
  onlineStatus,
  avatarSize,
}) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(tabs)/(profile)/[userId]', params: { userId: String(userId) } })}
      activeOpacity={0.7}
    >
      <UserListItem
        firstName={firstName}
        lastName={lastName}
        avatar_url={avatar_url}
        onlineStatus={onlineStatus}
        avatarSize={avatarSize}
      />
    </TouchableOpacity>
  );
};

export default PressableUser;
