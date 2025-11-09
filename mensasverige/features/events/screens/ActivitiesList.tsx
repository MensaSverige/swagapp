import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import EventCardModal from '../components/ExternalEventCardModal';
import GroupedEventsList from '../components/GroupedEventsList';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useScheduleEvents } from '../hooks/useEvents';

export const ActivitiesList = () => {
    const { user } = useStore();
    const { groupedEvents, nextEvent, loading } = useScheduleEvents();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    const handlePress = useCallback((event: Event) => {
        setSelectedEvent(event);
    }, []);

    const scrollToCurrentEvent = useCallback(() => {
        if (!scrollViewRef.current || !nextEventMarkerRef.current) {
            console.log('Missing refs for scrolling to next event')
            return;
        }

        nextEventMarkerRef.current?.measureLayout(
            scrollViewRef.current.getInnerViewNode(),
            (_, y) => {
                scrollViewRef.current?.scrollTo({ y, animated: true });
            }
        );
    }, [nextEventMarkerRef, scrollViewRef]);

    useEffect(() => {
        if (nextEvent && !didInitiallyScroll) {
            scrollToCurrentEvent();
            setDidInitiallyScroll(true);
        }
    }, [nextEvent, didInitiallyScroll, scrollToCurrentEvent]);

    return (
        <ThemedView useSafeArea={true} style={{ flex: 1 }}>
            {selectedEvent && (
                <EventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null)
                    }} />
            )}
            <View style={styles.header}>
                <ThemedText type="title">Aktiviteter</ThemedText>
                {nextEvent && (
                    <TouchableOpacity
                        onPress={scrollToCurrentEvent}
                        style={styles.scrollToButton}
                    >
                        <MaterialIcons name="update" size={24} color="#2563EB" />
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
                {loading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>Laddar aktiviteter...</Text>
                    </View>
                )}

                {!groupedEvents || Object.keys(groupedEvents).length === 0 && !loading && (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>Inga bokade aktiviteter</Text>
                    </View>
                )}

                <GroupedEventsList
                    groupedEvents={groupedEvents}
                    onEventPress={handlePress}
                    nextEvent={nextEvent}
                    nextEventMarkerRef={nextEventMarkerRef}
                    showCategories={true}
                    dateHeaderStyle="subtitle"
                />
            </ScrollView>
            {user && !user.isMember && (
                <NonMemberInfo />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        paddingLeft: 20,
    },
    scrollToButton: {
        paddingRight: 15,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContainer: {
        paddingBottom: 80,
        paddingHorizontal: 0,
    },
    loadingIndicator: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noEventsText: {
        fontSize: 16,
        color: '#6B7280',
    },
});

export default ActivitiesList;