import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import { LocationLinkButton } from './LocationLinkIcon';
import PressableUser from '@/features/account/components/PressableUser';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const createStyles = (colorScheme: string) => StyleSheet.create({
    cardContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        padding: 8,
    },
});


type ContactCardProps = {
    user: UserWithLocation;
    showCard: boolean;
    onClose: () => void;
    onZoom?: () => void;
};

const ContactCard: React.FC<ContactCardProps> = ({ user, showCard, onClose, onZoom }) => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');

    if (!showCard) {
        return null;
    }

    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons
                    name="close"
                    size={24}
                    color={colorScheme === 'dark' ? '#ffffff' : '#000000'}
                />
            </TouchableOpacity>

            <PressableUser
                userId={user.userId}
                firstName={user.firstName}
                lastName={user.lastName}
                avatar_url={user.avatar_url}
                onlineStatus={user.onlineStatus}
                avatarSize="lg"
                timestamp={user.location.timestamp}
            />
            <View style={styles.actionsContainer}>
                {user.contact_info?.phone?.trim() && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => Linking.openURL(`tel:${user.contact_info!.phone}`)}
                    >
                        <MaterialIcons name="phone" size={24} color={Colors.green500} />
                    </TouchableOpacity>
                )}
                {user.contact_info?.email?.trim() && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => Linking.openURL(`mailto:${user.contact_info!.email}`)}
                    >
                        <MaterialIcons name="email" size={24} color={Colors.warmGray400} />
                    </TouchableOpacity>
                )}
                {onZoom && (
                    <TouchableOpacity style={styles.actionButton} onPress={onZoom}>
                        <MaterialIcons name="zoom-in-map" size={24} color={Colors.primary400} />
                    </TouchableOpacity>
                )}
                {user.location && (
                    <LocationLinkButton latitude={user.location.latitude} longitude={user.location.longitude} />
                )}
            </View>
        </View>
    );
};

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the showCard or colorMode prop has changed
    return prevProps.showCard === nextProps.showCard;
});
