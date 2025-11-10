import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
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
import { useDashboardEventsIndependent } from '../hooks/useDashboardEventsIndependent';
import { navigateToAttendingEvents, navigateToBookableEvents, navigateToScheduleWithFilter } from '../utilities/navigationUtils';

const ParentEventDashboard = () => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [parentLoading, setParentLoading] = useState(true);
    
    // Use independent dashboard events hook - maintains separate state from activities list
    const { groupedEvents: groupedUpcomingEvents, hasMoreEvents = false, loading: eventsLoading, refetch } = useDashboardEventsIndependent(3);

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
        // Navigate to schedule with attending filter set to true
        navigateToAttendingEvents();
    };

    const navigateToMealsEvents = () => {
        // Navigate to schedule showing bookable meal/dinner events (category 'M' AND bookable)
        navigateToScheduleWithFilter({
            attending: null,
            bookable: true, 
            official: null,
            categories: ['M']
        });
    };

    const navigateToAllEvents = () => {
        // Navigate to schedule showing bookable events (for discovery)
        navigateToScheduleWithFilter({
            attending: null,
            bookable: true, 
            official: null,
            categories: []
        });
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
            
            {/* Quick Navigation Shortcuts */}
            <View style={styles.shortcutsSection}>
                <ThemedText type="subtitle" style={styles.shortcutsTitle}>Aktiviteter</ThemedText>
                <View style={styles.shortcutsRow}>
                    <TouchableOpacity 
                        style={styles.shortcutButton}
                        onPress={navigateToAllEvents}
                    >
                        <MaterialIcons 
                            name="explore" 
                            size={20} 
                            color={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600} 
                        />
                        <ThemedText style={styles.shortcutText}>Upptäck mer</ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.shortcutButton}
                        onPress={navigateToMealsEvents}
                    >
                        <MaterialIcons 
                            name="restaurant" 
                            size={20} 
                            color={colorScheme === 'dark' ? Colors.pink400 : Colors.pink600} 
                        />
                        <ThemedText style={styles.shortcutText}>Middag & Fest</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Upcoming Events Section */}
            {Object.keys(groupedUpcomingEvents).length > 0 && (
                <View style={styles.eventsSection}>
                    <View style={styles.sectionHeader}>
                        <ThemedText type="subtitle">Mina bokningar</ThemedText>
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

const createStyles = (colorScheme: string) => StyleSheet.create({
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
    shortcutsSection: {
        marginTop: 16,
        marginBottom: 8,
    },
    shortcutsTitle: {
        marginBottom: 12,
    },
    shortcutsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    shortcutButton: {
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.background900 : Colors.background50,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.background900 : Colors.background100,
    },
    shortcutText: {
        fontSize: 13,
        fontWeight: '500',
        color: colorScheme === 'dark' ? Colors.coolGray200 : Colors.coolGray700,
        textAlign: 'center',
    },
});

export default ParentEventDashboard;