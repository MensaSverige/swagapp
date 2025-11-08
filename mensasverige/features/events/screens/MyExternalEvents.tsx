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
import { fetchExternalEvents } from '../services/eventService';
import { ExternalEventDetails } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import {
    FootprintsBadge,
    GameBadge,
    GlobeBadge,
    LectureBadge,
    MicVocalBadge,
    PartyBadge,
    TeenBadge,
    WorkshopBadge
} from '../components/EventBadges';
import ExternalEventCardModal from '../components/ExternalEventCardModal';
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
            return null; // Return null or some default icon when the category code doesn't match any known codes
    }
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
        paddingHorizontal: 20,
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

export const MyExternalEvents = () => {
    const [events, setEvents] = useState<ExternalEventDetails[]>();
    const [groupedEvents, setGroupedEvents] = useState<{ [key: string]: ExternalEventDetails[] }>({});
    const [selectedEvent, setSelectedEvent] = useState<ExternalEventDetails | null>(events ? events[0] : null);
    const [nextEvent, setNextEvent] = useState<ExternalEventDetails | null>(events ? events[0] : null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useStore();

    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    useEffect(() => {
        fetchExternalEvents().then((events) => {
            events.sort((a, b) => {
                const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                return dateA - dateB;
            });

            const newGroupedEvents: { [key: string]: ExternalEventDetails[] } = events.reduce((grouped, event) => {
                const date = event.eventDate ? new Date(event.eventDate).toDateString() : 'No Date';
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(event);
                return grouped;
            }, {} as { [key: string]: ExternalEventDetails[] });

            setGroupedEvents(newGroupedEvents);
            setLoading(false);
        });
        console.log('fetching events');
    }, []);

    useEffect(() => {
        if (!groupedEvents || Object.keys(groupedEvents).length === 0) return;
        const findNextEvent = () => {
            const now = new Date();
            // const now = new Date(2024, 4, 9, 18, 10, 0);
            let nextEventTemp: ExternalEventDetails | null = null;

            for (const date in groupedEvents) {
                for (const event of groupedEvents[date]) {
                    if (!event.eventDate) continue;

                    const eventDate = new Date(event.eventDate);
                    eventDate.setHours(parseInt(event.endTime.split(':')[0]), parseInt(event.endTime.split(':')[1]));
                    if (eventDate > now) {
                        nextEventTemp = event;
                        break;
                    }
                }
                if (nextEventTemp) break;
            }
            if (nextEventTemp?.eventId === groupedEvents[Object.keys(groupedEvents)[0]][0].eventId) {
                // Don't show the scroll to next event button if the next event is the first event of the first day
                nextEventTemp = null;
            }
            setNextEvent(nextEventTemp);
        };
        const intervalId = setInterval(findNextEvent, 60000); // Update every minute
        findNextEvent();

        return () => clearInterval(intervalId);
    }, [groupedEvents]);

    const handlePress = useCallback((event: ExternalEventDetails) => {
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
        <ThemedView useSafeArea={true} style={{ flex: 1  }}>
            {selectedEvent && (
                <ExternalEventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null)
                    }} />
            )}
            <View style={styles.header}>
                <ThemedText type="title">Mina bokade aktiviteter</ThemedText>
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
                        {nextEvent && nextEvent.eventId === groupedEvents[date][0].eventId && (
                            <View ref={nextEventMarkerRef} />
                        )}
                        <ThemedText type="subtitle">{displayLocaleTimeStringDate(date ?? "")}</ThemedText>
                        <View style={styles.divider} />
                        {groupedEvents[date].map((event) => (
                            <TouchableOpacity
                                key={event.eventId}
                                onPress={() => handlePress(event)}
                                style={{
                                    opacity: event.eventDate && nextEvent && nextEvent.eventDate && event.eventDate < nextEvent?.eventDate ? 0.5 : 1.0
                                }}
                            >
                                {nextEvent && nextEvent.eventId == event.eventId && event.eventId != groupedEvents[date][0].eventId && (
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
                                            <View style={styles.categoriesContainer}>
                                                {event.categories?.map((category, index) => (
                                                    <View key={index} style={styles.categoryBadge}>
                                                        {getEventCategoryBadge(category.code, `#${category.colorBackground}`)}
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.eventLocation}>
                                            {event.location}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
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


export default MyExternalEvents;