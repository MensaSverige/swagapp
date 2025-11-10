import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Event } from '../../../api_schema/types';
import { DisplayTime } from '../utilities/DisplayTime';
import { getEventCategoryBadge } from '../utilities/EventCategories';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import OfficialEventIcon from '../../../components/icons/OfficialEventIcon';

interface EventListItemProps {
    event: Event;
    onPress: (event: Event) => void;
    opacity?: number;
    showCategories?: boolean;
    nextEventMarkerRef?: React.RefObject<View | null>;
    isNextEvent?: boolean;
    isFirstEventOfDay?: boolean;
}

const EventListItem: React.FC<EventListItemProps> = ({
    event,
    onPress,
    opacity = 1.0,
    showCategories = true,
    nextEventMarkerRef,
    isNextEvent = false,
    isFirstEventOfDay = false
}) => {
    console.log(event);
    const colorScheme = useColorScheme();
      const styles = createStyles(colorScheme ?? 'light');
    // Calculate if event should be grayed out (not bookable and user not attending)
    const shouldGrayOut = !event.bookable && (!!event.maxAttendees || event.maxAttendees === 0);
    const eventOpacity = shouldGrayOut ? 0.4 : opacity;
    
    return (
        <TouchableOpacity
            onPress={() => onPress(event)}
            style={{
                opacity: eventOpacity
            }}
        >
            {/* Next event marker - only show if it's the next event but not the first event of the day */}
            {isNextEvent && !isFirstEventOfDay && nextEventMarkerRef && (
                <View ref={nextEventMarkerRef} />
            )}

            <View style={[
                styles.eventItem, 
                event.attending && styles.attendingEventItem,
                //shouldGrayOut && { backgroundColor: 'rgba(228, 20, 20, 0.1)' }
            ]}>
                <View style={styles.timeContainer}>
                    <Text style={[styles.startTime,
                        shouldGrayOut ? { color: Colors.red600 } : { color: Colors.teal400 }

                    ]}>
                        {DisplayTime(event.start)}
                    </Text>
                    <Text style={[styles.endTime,
                        shouldGrayOut ? { color: Colors.red800 } : { color: Colors.teal800 }
                    ]}>
                        {event.end ? DisplayTime(event.end) : ''}
                    </Text>
                </View>
                        {event.attending && (
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="check-circle" size={14} color="#10B981" />
                            </View>
                        )}
                        {shouldGrayOut && (
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="event-busy" size={14} color={Colors.red600} />
                            </View>
                        )}
                        {event.bookable && (
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="event-available" size={14} color={Colors.info400} />
                            </View>
                        )}
                <View style={styles.eventContent}>
                    
                    <View style={styles.titleContainer}>

                        <Text style={[
                            styles.eventTitle,
                            shouldGrayOut ? { fontWeight: '400'} : { fontWeight: '600'}
                        ]}>
                            {event.name}
                        </Text>
                        {event.official && (
                            <View style={{ marginLeft: 4 }}>
                                <OfficialEventIcon size={14} color={Colors.primary500} />
                            </View>
                        )}

                    </View>
                    <Text style={styles.eventLocation}>
                        {event.locationDescription}
                    </Text>

                </View>
                {showCategories && (
                    <View style={styles.categoriesContainer}>

                        {event.tags?.map((category, index) => (
                            <View key={index} style={styles.categoryBadge}>
                                {getEventCategoryBadge(category.code)}
                            </View>
                        ))}
                    </View>
                )}

            </View>
        </TouchableOpacity>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    eventItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    attendingEventItem: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    timeContainer: {
        justifyContent: 'flex-start',
    },
    startTime: {
        fontSize: 14,
        color: colorScheme === 'dark' ? Colors.teal400 : Colors.teal600,
    },
    endTime: {
        fontSize: 14,
        color: colorScheme === 'dark' ? Colors.teal600 : Colors.teal800,
    },
    eventContent: {
        flex: 1,
        marginLeft: 0,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colorScheme === 'dark' ? Colors.info500: Colors.info700,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoriesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryBadge: {
        width: 20,
    },
    eventLocation: {
        fontSize: 14,
        color: Colors.coolGray600,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 6,
        marginTop: 2,
    },
});

export default EventListItem;