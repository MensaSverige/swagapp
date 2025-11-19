import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { User } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import UserAvatar from '@/features/map/components/UserAvatar';
import { createEventCardStyles } from '../styles/eventCardStyles';

interface UserListProps {
  users: User[];
  title: string;
  fallbackData?: Array<{ userId: string | number; fullName?: string }>;
  maxDisplayCount?: number;
  showMoreText?: string;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  title, 
  fallbackData = [], 
  maxDisplayCount = 10,
  showMoreText = "till"
}) => {
  const colorScheme = useColorScheme();
  const eventCardStyles = createEventCardStyles(colorScheme ?? 'light');

  if (users.length === 0 && fallbackData.length === 0) {
    return null;
  }

  return (
    <View style={eventCardStyles.hostsSection}>
      <Text style={eventCardStyles.subHeading}>
        {title}
      </Text>
      {users.length > 0 ? (
        <View style={eventCardStyles.userListContainer}>
          {users.slice(0, maxDisplayCount).map((user, index) => (
            <View key={user.userId || index} style={eventCardStyles.userListItem}>
              <UserAvatar
                avatarSize="sm"
                firstName={user.firstName}
                lastName={user.lastName}
                avatar_url={user.avatar_url ?? ""}
                onlineStatus="offline"
              />
              <View style={eventCardStyles.userListAvatar}>
                <Text style={eventCardStyles.detailText}>
                  {user.firstName} {user.lastName}
                </Text>
              </View>
            </View>
          ))}
          {users.length > maxDisplayCount && (
            <ThemedText style={eventCardStyles.attendeesMoreText}>
              ... och {users.length - maxDisplayCount} {showMoreText}
            </ThemedText>
          )}
        </View>
      ) : (
        fallbackData.length > 0 && (
          <View style={eventCardStyles.hostsSection}>
            {fallbackData.map((item, index) => (
              <ThemedText key={index}>{item.fullName || `${title} ${index + 1}`}</ThemedText>
            ))}
          </View>
        )
      )}
    </View>
  );
};

export default UserList;