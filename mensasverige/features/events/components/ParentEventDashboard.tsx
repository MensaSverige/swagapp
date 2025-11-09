import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchExternalRoot } from '../services/eventService';
import { ExternalRoot, Event } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParentEventDetails from './ParentEventDetails';
import GroupedEventsList from './GroupedEventsList';
import EventCardModal from './ExternalEventCardModal';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDashboardEvents } from '../hooks/useEvents';

const ParentEventDashboard = () => {
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [parentLoading, setParentLoading] = useState(true);
    
    // Use custom hook for dashboard events
    const { groupedEvents: groupedUpcomingEvents, hasMoreEvents = false, loading: eventsLoading } = useDashboardEvents(3);

    useEffect(() => {
        const loadParentEventInfo = async () => {
            try {
                const parentEventInfo = await fetchExternalRoot();
                setEventInfo(parentEventInfo);
            } catch (error) {
                console.error('Error loading parent event info:', error);
                setEventInfo(null);
            } finally {
                setParentLoading(false);
            }
        };

        loadParentEventInfo();
    }, []);

    const loading = parentLoading || eventsLoading;

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
                    
                    <GroupedEventsList
                        groupedEvents={groupedUpcomingEvents}
                        onEventPress={handleEventPress}
                        showCategories={true}
                        dateHeaderStyle="default"
                    />
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