import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFullUrl } from '../../common/functions/GetFullUrl';
import { OnlineStatus } from '../types/userWithLocation';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type UserAvatarProps = {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    avatar_url: string | null | undefined;
    avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    onlineStatus?: OnlineStatus;
};

const getSizeValue = (size: string) => {
    switch (size) {
        case 'xs': return 24;
        case 'sm': return 32;
        case 'md': return 40;
        case 'lg': return 48;
        case 'xl': return 56;
        case '2xl': return 64;
        default: return 48;
    }
};

export const getOnlineStatusColor = (status: OnlineStatus, colorMode: string) => {
    switch (status) {
      case 'online':
        return colorMode === 'dark' ? '#10b981' : '#059669';
      case 'away':
        return colorMode === 'dark' ? '#f59e0b' : '#d97706';
      default:
        return colorMode === 'dark' ? '#6b7280' : '#9ca3af';
    }
};

const createStyles = (size: number, borderColor: string, colorMode: string) => StyleSheet.create({
    container: {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorMode === 'dark' ? '#374151' : '#f9fafb',
        borderColor: borderColor,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    fallbackText: {
        fontSize: size * 0.4,
        fontWeight: 'bold',
        color: colorMode === 'dark' ? '#e5e7eb' : '#374151',
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    iconContainer: {
        position: 'absolute',
        alignSelf: 'center',
    },
});

const UserAvatar: React.FC<UserAvatarProps> = ({ firstName, lastName, avatar_url, avatarSize, onlineStatus }) => {
    const colorScheme = useColorScheme();
    const colorMode = colorScheme ?? 'light';
    const size = getSizeValue(avatarSize || 'lg');
    const onlineStatusColor = onlineStatus ? getOnlineStatusColor(onlineStatus, colorMode) : getOnlineStatusColor('offline', colorMode);
    const styles = createStyles(size, onlineStatusColor, colorMode);

    const getInitials = () => {
        const first = firstName?.charAt(0) || '';
        const last = lastName?.charAt(0) || '';
        return (first + last).toUpperCase();
    };

    return (
        <View style={styles.container}>
            {avatar_url ? (
                <Image
                    source={{ uri: getFullUrl(avatar_url) }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <>
                    <Text style={styles.fallbackText}>{getInitials()}</Text>
                    {!getInitials() && (
                        <View style={styles.iconContainer}>
                            <MaterialIcons 
                                name="person" 
                                size={size * 0.6} 
                                color={onlineStatusColor} 
                            />
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

export default React.memo(UserAvatar, (prevProps, nextProps) => {
  // Only re-render if the avatar_url or onlineStatus has changed
  return prevProps.avatar_url === nextProps.avatar_url &&
    prevProps.onlineStatus === nextProps.onlineStatus;
});