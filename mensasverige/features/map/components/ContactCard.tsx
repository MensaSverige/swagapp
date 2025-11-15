import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import UserWithLocation from '../types/userWithLocation';
import { timeUntil } from '../../events/utilities/TimeLeft';
import UserAvatar, { getOnlineStatusColor } from './UserAvatar';
import { LocationLinkButton } from './LocationLinkIcon';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const createStyles = (colorScheme: string) => StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 60,
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary400,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    marginBottom: 12,
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
};

const ContactCard: React.FC<ContactCardProps> = ({ user, showCard, onClose }) => {
    const ref = React.useRef(null);
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [comparisonDate, setComparisonDate] = useState(new Date());

    useEffect(() => {
        let intervalId = null;

        if (showCard) {
            intervalId = setInterval(() => {
                setComparisonDate(new Date());
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [showCard]);
    
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
            
            <View style={styles.headerContainer}>
                <UserAvatar 
                    firstName={user.firstName} 
                    lastName={user.lastName} 
                    avatar_url={user.avatar_url} 
                    onlineStatus={user.onlineStatus} 
                />
                
                <View style={styles.contentContainer}>
                    <Text style={styles.heading}>
                        {user.firstName} {user.lastName}
                    </Text>
                    {user.location.timestamp && (
                        <Text style={[styles.timeText, { color: getOnlineStatusColor(user.onlineStatus, colorScheme ?? 'light') }]}>
                            {timeUntil(comparisonDate, user.location.timestamp)} sedan
                        </Text>
                    )}

                    <View style={styles.actionsContainer}>
                        {user.contact_info?.phone && user.contact_info.phone.trim() !== '' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    Linking.openURL(`tel:${user.contact_info?.phone}`);
                                }}
                            >
                                <MaterialIcons name="phone" size={24} color={Colors.green500 || '#10b981'} />
                            </TouchableOpacity>
                        )}
                        {user.contact_info?.email && user.contact_info.email.trim() !== '' && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                    Linking.openURL(`mailto:${user.contact_info?.email}`);
                                }}
                            >
                                <MaterialIcons name="email" size={24} color={Colors.warmGray400 || '#9ca3af'} />
                            </TouchableOpacity>
                        )}

                        {user.location && (
                            <LocationLinkButton latitude={user.location.latitude} longitude={user.location.longitude} />
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default React.memo(ContactCard, (prevProps, nextProps) => {
    // Only re-render if the showCard or colorMode prop has changed
    return prevProps.showCard === nextProps.showCard;
});