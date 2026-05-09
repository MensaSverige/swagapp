import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import UserAvatar, { getOnlineStatusColor } from './UserAvatar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { timeUntil } from '../../events/utilities/TimeLeft';

type Props = {
    user: UserWithLocation;
    distance: number | null;
    onPress: (user: UserWithLocation) => void;
    isSelected: boolean;
};

function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

const UserListItem: React.FC<Props> = ({ user, distance, onPress, isSelected }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = createStyles(colorScheme, isSelected);
    const now = new Date();

    const name = (user.firstName || user.lastName)
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Anonym';

    return (
        <TouchableOpacity style={styles.row} onPress={() => onPress(user)} activeOpacity={0.7}>
            <UserAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatar_url={user.avatar_url}
                avatarSize="sm"
                onlineStatus={user.onlineStatus}
            />
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                {user.location.timestamp && (
                    <Text style={[styles.subtext, { color: getOnlineStatusColor(user.onlineStatus, colorScheme) }]}>
                        {timeUntil(now, user.location.timestamp)} sedan
                    </Text>
                )}
            </View>
            {distance !== null && (
                <Text style={styles.distance}>{formatDistance(distance)}</Text>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (colorScheme: string, isSelected: boolean) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
        backgroundColor: isSelected
            ? (colorScheme === 'dark' ? '#1e3a5f' : '#eff6ff')
            : 'transparent',
    },
    content: {
        flex: 1,
        gap: 2,
    },
    name: {
        fontSize: 15,
        fontWeight: '500',
        color: colorScheme === 'dark' ? '#f9fafb' : '#111827',
    },
    subtext: {
        fontSize: 12,
    },
    distance: {
        fontSize: 13,
        color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
        minWidth: 52,
        textAlign: 'right',
    },
});

export default UserListItem;
