import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ExternalEventDetails } from '../../../api_schema/types';
import {
    FootprintsBadge,
    GameBadge,
    GlobeBadge,
    LectureBadge,
    MicVocalBadge,
    PartyBadge,
    TeenBadge,
    WorkshopBadge
} from './EventBadges';

interface ExternalEventItemProps {
    event: ExternalEventDetails;
    onPress: (event: ExternalEventDetails) => void;
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
            return <PartyBadge color="#BE185D" />;
        case 'S': // spel/tävling
            return <GameBadge color="#D97706" />;
        case 'U': // ungdomsaktivitet
            return <TeenBadge color="#C026D3" />;
        case 'Up': //uppträdande
            return <MicVocalBadge color="#F59E0B" />;
        case 'Ut': // utflykt
            return <FootprintsBadge color="#65A30D" />;
        case 'W': // workshop
            return <WorkshopBadge color="#9333EA" />;
        default:
            return null;
    }
};

const ExternalEventItem: React.FC<ExternalEventItemProps> = ({
    event,
    onPress,
    opacity = 1.0,
    showCategories = true,
    nextEventMarkerRef,
    isNextEvent = false,
    isFirstEventOfDay = false
}) => {
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
                        {event.startTime}
                    </Text>
                    <Text style={styles.endTime}>
                        {event.endTime}
                    </Text>
                </View>
                <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle}>
                            {event.titel}
                        </Text>
                        {showCategories && (
                            <View style={styles.categoriesContainer}>
                                {event.categories?.map((category, index) => (
                                    <View key={index} style={styles.categoryBadge}>
                                        {getEventCategoryBadge(category.code, `#${category.colorBackground}`)}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                    <Text style={styles.eventLocation}>
                        {event.location}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    eventItem: {
        flexDirection: 'row',
        paddingVertical: 10,
    },
    timeContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 2,
    },
    startTime: {
        fontSize: 14,
        color: '#14B8A6',
        paddingTop: 2,
    },
    endTime: {
        fontSize: 14,
        color: '#0F766E',
    },
    eventContent: {
        flex: 1,
        marginLeft: 12,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2563EB',
        flex: 1,
    },
    categoriesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    categoryBadge: {
        width: 30,
    },
    eventLocation: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 10,
    },
});

export default ExternalEventItem;