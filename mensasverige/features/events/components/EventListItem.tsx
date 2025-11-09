import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    return (
        <TouchableOpacity
            onPress={() => onPress(event)}
            style={{
                opacity: opacity
            }}
        >
            {/* Next event marker - only show if it's the next event but not the first event of the day */}
            {isNextEvent && !isFirstEventOfDay && nextEventMarkerRef && (
                <View ref={nextEventMarkerRef} />
            )}

            <View style={[styles.eventItem, event.attending && styles.attendingEventItem]}>
                <View style={styles.timeContainer}>
                    <Text style={styles.startTime}>
                        {DisplayTime(event.start)}
                    </Text>
                    <Text style={styles.endTime}>
                        {event.end ? DisplayTime(event.end) : ''}
                    </Text>
                </View>
                
                <View style={styles.eventContent}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.eventTitle}>
                            {event.name}
                        </Text>
                        {event.official && (
                            <View style={{ marginLeft: 4 }}>
                                <OfficialEventIcon size={14} color={Colors.primary500} />
                            </View>
                        )}
                        {event.attending && (
                            <View style={{ marginLeft: 4 }}>
                                <MaterialIcons name="check-circle" size={14} color="#10B981" />
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

const styles = StyleSheet.create({
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
        color: Colors.teal500,
    },
    endTime: {
        fontSize: 14,
        color: Colors.teal700,
    },
    eventContent: {
        flex: 1,
        marginLeft: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.info400,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoriesContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    categoryBadge: {
        width: 30,
    },
    eventLocation: {
        fontSize: 14,
        color: Colors.coolGray400,
    },
});

export default EventListItem;