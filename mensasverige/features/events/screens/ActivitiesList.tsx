import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import { fetchEvents } from '../services/eventService';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import EventCardModal from '../components/ExternalEventCardModal';
import EventListItem from '../components/EventListItem';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';

export const displayLocaleTimeStringDate = (datestring: string) => {
    const date: Date = new Date(datestring ?? "");
    const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${capitalizedWeekday} ${dayMonth}`;
}

export const ActivitiesList = () => {
    const { user, events } = useStore();
    const [displayedEvents, setEvents] = useState<Event[]>(events);
    const [groupedEvents, setGroupedEvents] = useState<{ [key: string]: Event[] }>({});
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [nextEvent, setNextEvent] = useState<Event | null>(displayedEvents ? displayedEvents[0] : null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);
    const [loading, setLoading] = useState(true);


    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    useEffect(() => {
        // Use events from store if available, otherwise fetch
        const eventsToProcess = events && events.length > 0 ? events : null;
        
        if (eventsToProcess) {
            processEvents(eventsToProcess);
        } else {
            fetchEvents().then((events) => {
                processEvents(events);
            });
        }
        console.log('Loading events for schedule view');
    }, [events]);

    const processEvents = (events: Event[]) => {
        const sortedEvents = [...events].sort((a, b) => {
            const dateA = a.start ? new Date(a.start).getTime() : 0;
            const dateB = b.start ? new Date(b.start).getTime() : 0;
            return dateA - dateB;
        });

        const newGroupedEvents = sortedEvents.reduce((grouped, event) => {
            const date = event.start ? new Date(event.start).toDateString() : 'No Date';
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(event);
            return grouped;
        }, {} as { [key: string]: Event[] });

        setGroupedEvents(newGroupedEvents);
        setLoading(false);
    };

    useEffect(() => {
        if (!groupedEvents || Object.keys(groupedEvents).length === 0) return;
        const findNextEvent = () => {
            const now = new Date();
            let nextEventTemp: Event | null = null;

            for (const date in groupedEvents) {
                for (const event of groupedEvents[date]) {
                    if (!event.start) continue;

                    const eventDate = new Date(event.start);
                    //eventDate.setHours(parseInt(event.end.split(':')[0]), parseInt(event.endTime.split(':')[1]));
                    if (eventDate > now) {
                        nextEventTemp = event;
                        break;
                    }
                }
                if (nextEventTemp) break;
            }
            if (nextEventTemp?.id === groupedEvents[Object.keys(groupedEvents)[0]][0].id) {
                // Don't show the scroll to next event button if the next event is the first event of the first day
                nextEventTemp = null;
            }
            setNextEvent(nextEventTemp);
        };
        const intervalId = setInterval(findNextEvent, 60000); // Update every minute
        findNextEvent();

        return () => clearInterval(intervalId);
    }, [groupedEvents]);

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

                {Object.keys(groupedEvents).map((date) => (
                    <View key={date}>
                        {nextEvent && nextEvent.id === groupedEvents[date][0].id && (
                            <View ref={nextEventMarkerRef} />
                        )}
                        <ThemedText type="subtitle">{displayLocaleTimeStringDate(date ?? "")}</ThemedText>
                        <View style={styles.divider} />
                        {groupedEvents[date].map((event) => (
                            <EventListItem
                                key={event.id}
                                event={event}
                                onPress={handlePress}
                                opacity={event.start && nextEvent && nextEvent.start && event.start < nextEvent?.start ? 0.5 : 1.0}
                                nextEventMarkerRef={nextEventMarkerRef}
                                isNextEvent={!!(nextEvent && nextEvent.id === event.id)}
                                isFirstEventOfDay={event.id === groupedEvents[date][0].id}
                                showCategories={true}
                            />
                        ))}
                    </View>
                ))}
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
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 8,
    },
});

export default ActivitiesList;