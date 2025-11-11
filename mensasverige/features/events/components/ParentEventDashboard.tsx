import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { fetchExternalRoot, fetchEvents } from '../services/eventService';
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
import { EVENT_CATEGORIES } from '../utilities/EventCategories';

const ParentEventDashboard = () => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [parentLoading, setParentLoading] = useState(true);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    
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

        const loadAvailableCategories = async () => {
            try {
                setCategoriesLoading(true);
                // Fetch all events to see which categories have events
                const allEvents = await fetchEvents();
                
                // Count bookable events per category
                const categoryEventCounts: Record<string, number> = {};
                allEvents
                    .filter(event => event.bookable) // Only count bookable events
                    .forEach(event => {
                        event.tags?.forEach(tag => {
                            if (tag.code) {
                                categoryEventCounts[tag.code] = (categoryEventCounts[tag.code] || 0) + 1;
                            }
                        });
                    });
                
                // Sort categories by event count and take top 4
                const sortedCategories = Object.entries(categoryEventCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 4)
                    .map(([code]) => code);
                
                console.log('Bookable events per category:', categoryEventCounts);
                console.log('Top 4 categories by bookable events:', sortedCategories);
                setAvailableCategories(sortedCategories);
            } catch (error) {
                console.error('Error loading available categories:', error);
                setAvailableCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadParentEventInfo();
        loadAvailableCategories();
    }, []);

    const loading = parentLoading || eventsLoading || categoriesLoading;

    const navigateToFullSchedule = () => {
        // Navigate to schedule with attending filter set to true
        navigateToAttendingEvents();
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

    // Helper function to check if a category has events available
    const hasCategoryEvents = (categoryCode: string): boolean => {
        return availableCategories.includes(categoryCode);
    };

    // Create navigation functions for each category
    const createNavigateToCategory = (categoryCode: string) => () => {
        navigateToScheduleWithFilter({
            attending: null,
            bookable: categoryCode === 'M' ? true : null, // Only meals/dinner events need to be bookable
            official: null,
            categories: [categoryCode]
        });
    };

    // Define shortcut configurations using EVENT_CATEGORIES
    const shortcutConfigs = EVENT_CATEGORIES
        .filter(category => hasCategoryEvents(category.code)) // Only show categories that have events
        .map(category => ({
            key: category.code,
            label: category.label,
            icon: category.icon,
            color: category.color,
            onPress: createNavigateToCategory(category.code),
            showCondition: hasCategoryEvents(category.code)
        }));

    // Filter shortcuts to only show available ones
    const visibleShortcuts = shortcutConfigs.filter(shortcut => shortcut.showCondition);

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
                <ThemedText type="subtitle" style={styles.shortcutsTitle}>Vad vill du göra nu?</ThemedText>
                <View style={styles.shortcutsRow}>
                    {visibleShortcuts.map((shortcut) => (
                        <TouchableOpacity 
                            key={shortcut.key}
                            style={styles.shortcutButton}
                            onPress={shortcut.onPress}
                        >
                            <MaterialIcons 
                                name={shortcut.icon} 
                                size={14} 
                                color={shortcut.color} 
                            />
                            <ThemedText style={styles.shortcutText}>{shortcut.label}</ThemedText>
                        </TouchableOpacity>
                    ))}
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
        marginTop: 16
    },
    shortcutsTitle: {
        marginBottom: 12,
    },
    shortcutsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    shortcutButton: {
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.background900 : Colors.background50,
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRadius: 6,
        alignItems: 'center',
        gap: 2,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.background900 : Colors.background100,
        minHeight: 38,
    },
    shortcutText: {
        fontSize: 9,
        fontWeight: '500',
        color: colorScheme === 'dark' ? Colors.coolGray200 : Colors.coolGray700,
        textAlign: 'center',
        lineHeight: 11,
    },
});

export default ParentEventDashboard;