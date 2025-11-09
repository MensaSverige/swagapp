import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchExternalRoot, fetchEvents } from '../services/eventService';
import { ExternalRoot, Event } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParentEventDetails from './ParentEventDetails';
import SiteNews from '../../common/components/SiteNews';
import EventListItem from './EventListItem';
import EventCardModal from './ExternalEventCardModal';
import { displayLocaleTimeStringDate } from '../screens/ActivitiesList';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import useStore from '../../common/store/store';
import { Colors } from '@/constants/Colors';

const ParentEventDashboard = () => {
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [groupedUpcomingEvents, setGroupedUpcomingEvents] = useState<{ [key: string]: Event[] }>({});
    const [hasMoreEvents, setHasMoreEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const { setEvents } = useStore();

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch both parent event info and child events in parallel
                const [parentEventInfo, events] = await Promise.all([
                    fetchExternalRoot(),
                    fetchEvents()
                ]);

                setEventInfo(parentEventInfo);

                if (parentEventInfo && events?.length > 0) {
                    // Sort events by date and filter upcoming ones that user is attending
                    const now = new Date();
                    const myUpcomingEvents = events
                        .filter(event => {
                            if (!event.start || !event.end || !event.attending) return false;
                            const eventDate = new Date(event.start);
                            const [hours, minutes] = event.end.split(':');
                            eventDate.setHours(parseInt(hours), parseInt(minutes));
                            return eventDate > now;
                        })
                        .sort((a, b) => {
                            const dateA = a.start ? new Date(a.start).getTime() : 0;
                            const dateB = b.start ? new Date(b.start).getTime() : 0;
                            return dateA - dateB;
                        });
                    
                    const upcomingEventsFiltered = myUpcomingEvents.slice(0, 3); // Get the first 3 for dashboard
                    setHasMoreEvents(myUpcomingEvents.length > 3); // Check if there are more events
                    
                    // Group the filtered events by date
                    const groupedEvents = upcomingEventsFiltered.reduce((grouped, event) => {
                        const date = event.start ? new Date(event.start).toDateString() : 'No Date';
                        if (!grouped[date]) {
                            grouped[date] = [];
                        }
                        grouped[date].push(event);
                        return grouped;
                    }, {} as { [key: string]: Event[] });
                    
                    setEvents(events); // Store all events in store
                    setGroupedUpcomingEvents(groupedEvents);
                } else {
                    setGroupedUpcomingEvents({});
                    setHasMoreEvents(false);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                setEventInfo(null);
                setGroupedUpcomingEvents({});
                setHasMoreEvents(false);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [setEvents]);

    const navigateToFullSchedule = () => {
        router.push('/(tabs)/schedule');
    };

    const handleEventPress = (event: Event) => {
        // Show the modal with event details instead of just navigating
        setSelectedEvent(event);
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Laddar...</ThemedText>
            </ThemedView>
        );
    }

    // If no parent event exists, show a simple message
    if (!eventInfo) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="subtitle">Inga pågående evenemang</ThemedText>
                <ThemedText style={styles.noEventText}>
                    Det finns för närvarande inga stora evenemang eller träffar planerade.
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Event Detail Modal */}
            {selectedEvent && (
                <EventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null);
                    }}
                />
            )}
            

            <ParentEventDetails />
            
            {/* Upcoming Events Section */}
            {Object.keys(groupedUpcomingEvents).length > 0 && (
                <View style={styles.eventsSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle">Mina aktiviteter</ThemedText>
                        <TouchableOpacity 
                            onPress={navigateToFullSchedule}
                            style={styles.seeAllButton}
                        >
                            <ThemedText style={styles.seeAllText}>Se alla</ThemedText>
                            <MaterialIcons name="chevron-right" size={16} color={Colors.primary400} />
                        </TouchableOpacity>
                    </View>
                    
                    {Object.keys(groupedUpcomingEvents).map((date) => (
                        <View key={date}>
                            <View style={styles.dateHeader}>
                            <ThemedText type="defaultSemiBold">{displayLocaleTimeStringDate(date)}</ThemedText>
                            </View>
                            <View style={styles.divider} />

                                {groupedUpcomingEvents[date].map((event) => (
                                    <EventListItem
                                        key={event.id}
                                        event={event}
                                        onPress={handleEventPress}
                                        showCategories={true}
                                    />
                                ))}
                        </View>
                    ))}       
                </View>
            )}
            
            {/* No upcoming events message */}
            {Object.keys(groupedUpcomingEvents).length === 0 && eventInfo && (
                <View style={styles.noEventsContainer}>
                    <ThemedText style={styles.noEventsText}>
                        Inga bokade aktiviteter för närvarande
                    </ThemedText>
                    <TouchableOpacity 
                        onPress={navigateToFullSchedule}
                        style={styles.browseButton}
                    >
                        <ThemedText style={styles.browseButtonText}>Bläddra bland aktiviteter</ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Site News Section */}
            <View style={styles.newsSection}>
                <SiteNews />
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding:16,
        flex: 1
    },
    loadingText: {
        textAlign: 'center',
        color: Colors.coolGray500,
        marginVertical: 20,
    },
    noEventText: {
        color: Colors.coolGray500,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    eventsSection: {
        marginTop: 24
    },
    dateHeader: {
        paddingHorizontal: 0,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        color: Colors.primary400,
        fontSize: 14,
        fontWeight: '500',
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
    },
    noEventsText: {
        fontSize: 16,
        color: Colors.coolGray500,
        textAlign: 'center',
        marginBottom: 16,
    },
    browseButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.primary500,
        borderRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    newsSection: {
        marginTop: 24,
    },
});

export default ParentEventDashboard;