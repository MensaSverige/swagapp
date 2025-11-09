import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchExternalRoot, fetchExternalEvents } from '../../events/services/eventService';
import { ExternalRoot, ExternalEventDetails } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParentEventDetails from './ParentEventDetails';
import SiteNews from './SiteNews';
import ExternalEventItem from '../../events/components/ExternalEventItem';
import ExternalEventCardModal from '../../events/components/ExternalEventCardModal';
import { displayLocaleTimeStringDate } from '../../events/screens/MyExternalEvents';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import useStore from '../store/store';

const ParentEventDashboard = () => {
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [groupedUpcomingEvents, setGroupedUpcomingEvents] = useState<{ [key: string]: ExternalEventDetails[] }>({});
    const [hasMoreEvents, setHasMoreEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ExternalEventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { setExternalEvents } = useStore();

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch both parent event info and child events in parallel
                const [parentEventInfo, events] = await Promise.all([
                    fetchExternalRoot(),
                    fetchExternalEvents()
                ]);

                setEventInfo(parentEventInfo);

                if (parentEventInfo && events?.length > 0) {
                    // Sort events by date and filter upcoming ones in a single pass
                    const now = new Date();
                    const allUpcomingEvents = events
                        .filter(event => {
                            if (!event.eventDate || !event.endTime) return false;
                            const eventDate = new Date(event.eventDate);
                            const [hours, minutes] = event.endTime.split(':');
                            eventDate.setHours(parseInt(hours), parseInt(minutes));
                            return eventDate > now;
                        })
                        .sort((a, b) => {
                            const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                            const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                            return dateA - dateB;
                        });
                    
                    const upcomingEventsFiltered = allUpcomingEvents.slice(0, 6); // Get the first 6 for dashboard
                    setHasMoreEvents(allUpcomingEvents.length > 6); // Check if there are more events
                    
                    // Group the filtered events by date
                    const groupedEvents = upcomingEventsFiltered.reduce((grouped, event) => {
                        const date = event.eventDate ? new Date(event.eventDate).toDateString() : 'No Date';
                        if (!grouped[date]) {
                            grouped[date] = [];
                        }
                        grouped[date].push(event);
                        return grouped;
                    }, {} as { [key: string]: ExternalEventDetails[] });
                    
                    setExternalEvents(events); // Store all events in store
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
    }, [setExternalEvents]);

    const navigateToFullSchedule = () => {
        router.push('/(tabs)/schedule');
    };

    const handleEventPress = (event: ExternalEventDetails) => {
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
                <ExternalEventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null);
                    }}
                />
            )}
            
            {/* Parent Event Details */}
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
                            <MaterialIcons name="chevron-right" size={16} color="#2563EB" />
                        </TouchableOpacity>
                    </View>
                    
                    {Object.keys(groupedUpcomingEvents).map((date) => (
                        <View key={date} style={styles.dateGroup}>
                            <ThemedText type="subtitle">{displayLocaleTimeStringDate(date)}</ThemedText>
                            <View style={styles.divider} />
                            <View style={styles.eventsList}>
                                {groupedUpcomingEvents[date].map((event) => (
                                    <ExternalEventItem
                                        key={event.eventId}
                                        event={event}
                                        onPress={handleEventPress}
                                        showCategories={true}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                    
                    {hasMoreEvents && (
                        <TouchableOpacity 
                            onPress={navigateToFullSchedule}
                            style={styles.viewMoreButton}
                        >
                            <ThemedText style={styles.viewMoreText}>Visa fler aktiviteter</ThemedText>
                            <MaterialIcons name="arrow-forward" size={16} color="#2563EB" />
                        </TouchableOpacity>
                    )}
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
        padding: 0,
    },
    loadingText: {
        textAlign: 'center',
        color: '#6B7280',
        marginVertical: 20,
    },
    noEventText: {
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    eventsSection: {
        marginTop: 24,
    },
    dateGroup: {
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        color: '#2563EB',
        fontSize: 14,
        fontWeight: '500',
    },
    eventsList: {
        gap: 12,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2563EB',
        backgroundColor: 'transparent',
    },
    viewMoreText: {
        color: '#2563EB',
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
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    browseButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#2563EB',
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