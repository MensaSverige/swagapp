import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { DisplayTime } from '../utilities/DisplayTime';
import CategoryBadge from './badges/CategoryBadge';
import { canonicalCategoryCode } from '../utilities/EventCategories';
import { Colors } from '@/constants/Colors';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { formatRegion } from '../utils/mainEventUtils';
import { PAGE_PADDING } from '../styles/typeScale';

interface EventListItemProps {
    event: ExtendedEvent;
    onPress: (event: ExtendedEvent) => void;
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
    const colorScheme = useColorScheme();
    const styles = useMemo(() => createStyles(colorScheme ?? 'light'), [colorScheme]);

    const shouldGrayOut = (!event.bookable && !event.attending) || !event.isFutureEvent;
    const meta = [formatRegion(event), event.locationDescription].filter(Boolean).join(' · ');
    const opacityStyle = useMemo(() => (opacity < 1 ? { opacity } : undefined), [opacity]);

    return (
        <TouchableOpacity
            onPress={() => onPress(event)}
            style={shouldGrayOut ? styles.dimmed : opacityStyle}
        >
            {isNextEvent && !isFirstEventOfDay && nextEventMarkerRef && (
                <View ref={nextEventMarkerRef} />
            )}

            <View style={[
                styles.eventItem,
                event.attending && styles.attendingEventItem,
            ]}>
                <View style={styles.timeContainer}>
                    <Text style={shouldGrayOut ? styles.startTimeGrayOut : styles.startTime}>
                        {DisplayTime(event.start)}
                    </Text>
                    <Text style={shouldGrayOut ? styles.endTimeGrayOut : styles.endTime}>
                        {event.end ? DisplayTime(event.end) : ''}
                    </Text>
                </View>
                <View style={styles.eventContent}>
                    <View style={styles.titleContainer}>
                        <Text style={shouldGrayOut ? styles.eventTitleGrayOut : styles.eventTitle}>
                            {event.name}
                        </Text>
                    </View>
                    {!!meta && <Text style={styles.eventLocation}>{meta}</Text>}
                </View>
                {showCategories && (
                    <View style={styles.categoriesContainer}>
                        {event.tags?.map((category, index) => (
                            <CategoryBadge
                                key={index}
                                categoryCode={canonicalCategoryCode(category)}
                                showLabel={false}
                                size="small"
                            />
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
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: PAGE_PADDING,
        paddingVertical: 10,
    },
    attendingEventItem: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    dimmed: {
        opacity: 0.4,
    },
    timeContainer: {
        minWidth: 40,
    },
    startTime: {
        fontSize: 14,
        color: colorScheme === 'dark' ? Colors.teal400 : Colors.teal600,
    },
    startTimeGrayOut: {
        fontSize: 14,
        color: Colors.red600,
    },
    endTime: {
        fontSize: 14,
        color: colorScheme === 'dark' ? Colors.teal600 : Colors.teal800,
    },
    endTimeGrayOut: {
        fontSize: 14,
        color: Colors.red800,
    },
    eventContent: {
        flex: 1,
        gap: 2,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colorScheme === 'dark' ? Colors.info500 : Colors.info700,
    },
    eventTitleGrayOut: {
        fontSize: 16,
        fontWeight: '400',
        color: colorScheme === 'dark' ? Colors.info500 : Colors.info700,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoriesContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    eventLocation: {
        fontSize: 14,
        color: Colors.coolGray600,
    },
});

export default React.memo(EventListItem);
