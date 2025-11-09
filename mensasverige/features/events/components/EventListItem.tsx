import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Event } from '../../../api_schema/types';
import { DisplayTime } from '../utilities/DisplayTime';
import {
    ExploreBadge,
    GameBadge,
    GlobeBadge,
    LectureBadge,
    MicVocalBadge,
    PartyBadge,
    RestaurantBadge,
    TeenBadge,
    WorkshopBadge
} from './EventBadges';
import { Colors } from '@/constants/Colors'

interface EventListItemProps {
    event: Event;
    onPress: (event: Event) => void;
    opacity?: number;
    showCategories?: boolean;
    nextEventMarkerRef?: React.RefObject<View | null>;
    isNextEvent?: boolean;
    isFirstEventOfDay?: boolean;
}

const getEventCategoryBadge = (categoryCode: string, color: string) => {
    switch (categoryCode) {
        case 'F': // föreläsning
            return <LectureBadge color="#6366F1" />;
        case 'Fö': // föreningsarbete
            return <GlobeBadge color="#1E3A8A" />;
        case 'M': // middag/festligheter
            return <RestaurantBadge color="#BE185D" />;
        case 'S': // spel/tävling
            return <GameBadge color="#D97706" />;
        case 'U': // ungdomsaktivitet
            return <TeenBadge color="#C026D3" />;
        case 'Up': //uppträdande
            return <MicVocalBadge color="#F59E0B" />;
        case 'Ut': // utflykt
            return <ExploreBadge color="#65A30D" />;
        case 'W': // workshop
            return <WorkshopBadge color="#9333EA" />;
        default:
            return null;
    }
};

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

            <View style={styles.eventItem}>
                <View style={styles.timeContainer}>
                    <Text style={styles.startTime}>
                        {DisplayTime(event.start)}
                    </Text>
                    <Text style={styles.endTime}>
                        {event.end ? DisplayTime(event.end) : ''}
                    </Text>
                </View>
                <View style={styles.eventContent}>

                    <Text style={styles.eventTitle}>
                        {event.name}
                    </Text>
                    <Text style={styles.eventLocation}>
                        {event.locationDescription}
                    </Text>

                </View>
                {showCategories && (
                    <View style={styles.categoriesContainer}>
                        {event.tags?.map((category, index) => (
                            <View key={index} style={styles.categoryBadge}>
                                {getEventCategoryBadge(category.code, `#${category.colorBackground}`)}
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
        marginBottom: 20,
        justifyContent: 'space-between',
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
        flex: 1,
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