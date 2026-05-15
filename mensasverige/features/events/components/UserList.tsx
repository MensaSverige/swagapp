import React from 'react';
import { View, useColorScheme } from 'react-native';
import { User } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import PressableUser from '@/features/account/components/PressableUser';
import { createEventCardStyles } from '../styles/eventCardStyles';
import { Collapsible } from '@/components/Collapsible';

interface UserListProps {
  users: User[];
  title: string;
  fallbackData?: Array<{ userId: string | number; fullName?: string }>;
  maxDisplayCount?: number;
  showMoreText?: string;
  expandable?: boolean;
  initialExpanded?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  users,
  title,
  fallbackData = [],
  maxDisplayCount = 10,
  showMoreText = "till",
  expandable = false,
  initialExpanded = false,
}) => {
  const colorScheme = useColorScheme();
  const eventCardStyles = createEventCardStyles(colorScheme ?? 'light');

  if (users.length === 0 && fallbackData.length === 0) {
    return null;
  }

  const userRows = users.length > 0 ? (
    <View style={eventCardStyles.userListContainer}>
      {users.slice(0, maxDisplayCount).map((user, index) => (
        <PressableUser
          key={user.userId || index}
          userId={user.userId}
          firstName={user.firstName}
          lastName={user.lastName}
          avatar_url={user.avatar_url}
        />
      ))}
      {users.length > maxDisplayCount && (
        <ThemedText style={eventCardStyles.attendeesMoreText}>
          ... och {users.length - maxDisplayCount} {showMoreText}
        </ThemedText>
      )}
    </View>
  ) : (
    fallbackData.length > 0 ? (
      <View style={eventCardStyles.hostsSection}>
        {fallbackData.map((item, index) => (
          <ThemedText key={index}>{item.fullName || `${title} ${index + 1}`}</ThemedText>
        ))}
      </View>
    ) : null
  );

  if (!userRows) return null;

  if (expandable) {
    const collapsibleTitle = users.length > 0
      ? `${title} (${users.length})`
      : title;
    return (
      <View style={eventCardStyles.hostsSection}>
        <Collapsible title={collapsibleTitle} initialOpen={initialExpanded}>
          {userRows}
        </Collapsible>
      </View>
    );
  }

  return (
    <View style={eventCardStyles.hostsSection}>
      <ThemedText type='subtitle'>{title}</ThemedText>
      {userRows}
    </View>
  );
};

export default UserList;