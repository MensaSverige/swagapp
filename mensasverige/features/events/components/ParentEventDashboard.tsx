import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { fetchExternalRoot } from '../services/eventService';
import { ExternalRoot } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParentEventDetails from './ParentEventDetails';
import GroupedEventsList from './GroupedEventsList';
import UnifiedEventModal from './UnifiedEventModal';
import CategoryBadge from './CategoryBadge';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useEvents } from '../hooks/useEvents';
import { navigateToAttendingEvents, navigateToBookableEvents, navigateToScheduleWithFilter, navigateToLastMinuteEvents } from '../utilities/navigationUtils';
import { EVENT_CATEGORIES } from '../utilities/EventCategories';
import { ExtendedEvent } from '../types/eventUtilTypes';

const ParentEventDashboard = () => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [eventInfo, setEventInfo] = useState<ExternalRoot | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
    const [parentLoading, setParentLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const {
        dashboardGroupedEvents,
        loading: eventsLoading,
        refetch,
        addOrUpdateEvent,
        topCategories,
        lastMinuteEvents
    } = useEvents();

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

    const navigateToAllEvents = () => {
        // Navigate to schedule showing bookable events (for discovery)
        navigateToBookableEvents();
    };

    const handleEventPress = (event: ExtendedEvent) => {
        // Show the modal with event details instead of just navigating
        setSelectedEvent(event);
    };

    const handleEventCreated = useCallback((event: ExtendedEvent) => {
        setShowCreateForm(false);
        // Add the new event to the store - this will automatically update all views
        addOrUpdateEvent(event);
        // Optionally show the created event details after a brief delay
        setTimeout(() => setSelectedEvent(event), 500);
    }, [addOrUpdateEvent]);

    const handleCancelCreate = useCallback(() => {
        setShowCreateForm(false);
    }, []);

    // Helper function to check if a category has events available
    const hasCategoryEvents = (categoryCode: string): boolean => {
        return topCategories.includes(categoryCode);
    };

    // Create navigation functions for each category
    const createNavigateToCategory = (categoryCode: string) => () => {
        navigateToScheduleWithFilter({
            attendingOrHost: null,
            bookable: categoryCode === 'M' ? true : null, // Only meals/dinner events need to be bookable
            official: null,
            categories: [categoryCode]
        });
    };

    // Create navigation functions for event types
    const createNavigateToEventType = (official: boolean) => () => {
        navigateToScheduleWithFilter({
            attendingOrHost: null,
            bookable: null,
            official: official,
            categories: []
        });
    };

    // Define shortcut configurations using EVENT_CATEGORIES
    const categoryShortcuts = EVENT_CATEGORIES
        .filter(category => hasCategoryEvents(category.code)) // Only show categories that have events
        .map(category => ({
            key: category.code,
            type: 'category' as const,
            label: category.label,
            icon: category.icon,
            color: category.color,
            onPress: createNavigateToCategory(category.code),
            showCondition: hasCategoryEvents(category.code)
        }));

    // Filter shortcuts to only show available ones (limit to first 6 to fit nicely)
    const visibleShortcuts = categoryShortcuts.filter(shortcut => shortcut.showCondition).slice(0, 6);

    if (loading && !eventInfo) {
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
            {/* Unified Event Modal - handles both view/edit and create modes */}
            <UnifiedEventModal
                event={selectedEvent || undefined}
                open={!!selectedEvent || showCreateForm}
                mode={showCreateForm ? 'create' : 'view'}
                onClose={() => {
                    setSelectedEvent(null);
                    setShowCreateForm(false);
                }}
                onEventUpdated={(updatedEvent: ExtendedEvent) => {
                    // The event has been updated, add/update it in the store
                    console.log('Event updated:', updatedEvent);
                    addOrUpdateEvent(updatedEvent);
                    setSelectedEvent(null);
                }}
                onEventCreated={handleEventCreated}
            />


            <ParentEventDetails />


            {/* Quick Navigation Shortcuts */}
            <View style={styles.shortcutsSection}>
                <View style={styles.sectionTitleContainer}>
                    <MaterialIcons name="explore" size={20} color={Colors.primary600} />
                    <ThemedText type="subtitle" style={styles.shortcutsTitle}>Hitta aktiviteter</ThemedText>
                </View>
                <View style={styles.shortcutsGrid}>
                    {visibleShortcuts.map((shortcut) => (
                        <View key={shortcut.key} style={styles.shortcutButton}>
                            <CategoryBadge
                                categoryCode={shortcut.type === 'category' ? shortcut.key : undefined}
                                label={shortcut.label}
                                showLabel={true}
                                size="small"
                                onPress={shortcut.onPress}
                            />
                        </View>
                    ))}
                </View>
            </View>

            {/* Last Minute and Create Activity Side by Side */}
            <View style={styles.actionsRow}>
                {/* Last Minute Section */}
                {lastMinuteEvents.length > 0 && (
                    <TouchableOpacity
                        style={[
                            styles.actionCard,
                            styles.lastMinuteCard,
                            styles.equalWidth
                        ]}
                        onPress={navigateToLastMinuteEvents}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionContent}>
                            <View style={styles.titleContainer}>
                                <MaterialIcons name="downhill-skiing" size={20} color={colorScheme === 'dark' ? Colors.amber300 : Colors.amber600} />
                                <ThemedText type="subtitle" style={styles.lastMinuteTitle}>Sista minuten</ThemedText>
                            </View>
                            <ThemedText style={styles.lastMinuteDescription}>
                                Hinner du med? {lastMinuteEvents.length} {lastMinuteEvents.length === 1 ? 'aktivitet' : 'aktiviteter'} startar snart!
                            </ThemedText>

                            <MaterialIcons name="arrow-forward" size={16} color={colorScheme === 'dark' ? Colors.amber400 : Colors.amber700} style={styles.actionArrow} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Create Activity Invitation Section */}
                {!loading && Object.keys(dashboardGroupedEvents).length !== 0 && eventInfo && ( 
                <TouchableOpacity
                    style={[
                        styles.actionCard,
                        styles.createCard,
                        lastMinuteEvents.length > 0 ? styles.equalWidth : styles.fullWidthSingle
                    ]}
                    onPress={() => setShowCreateForm(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionContent}>
                        <View style={styles.titleContainer}>
                            <MaterialIcons name="celebration" size={20} color={Colors.primary300} />
                            <ThemedText type="subtitle" style={styles.createTitle}>Bjud in andra!</ThemedText>
                        </View>
                        <ThemedText style={styles.createDescription}>
                            Skapa dina egna aktiviteter och träffa nya vänner.
                        </ThemedText>
                        <MaterialIcons name="arrow-forward" size={16} color={Colors.primary400} style={styles.actionArrow} />
                    </View>
                </TouchableOpacity>
                )}
            </View>


            {/* Upcoming Events Section */}
            {Object.keys(dashboardGroupedEvents).length > 0 && (
                <View style={styles.eventsSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <MaterialIcons name="event-available" size={20} color={Colors.primary600} />
                            <ThemedText type="subtitle">Mina bokningar</ThemedText>
                        </View>
                        <TouchableOpacity
                            onPress={navigateToFullSchedule}
                            style={styles.seeAllButton}
                        >
                            <ThemedText style={styles.seeAllText}>Se alla</ThemedText>
                            <MaterialIcons name="chevron-right" size={16} color={Colors.primary400} />
                        </TouchableOpacity>
                    </View>

                    <GroupedEventsList
                        groupedEvents={dashboardGroupedEvents}
                        onEventPress={handleEventPress}
                        showCategories={true}
                        dateHeaderStyle="default"
                    />
                </View>
            )}

            {/* No upcoming events message */}
            {!loading && Object.keys(dashboardGroupedEvents).length === 0 && eventInfo && (
                <TouchableOpacity
                    onPress={navigateToAllEvents}
                //style={styles.browseButton}
                >
                    <View style={[styles.noEventsContainer, styles.actionCard]}>
                        <MaterialIcons name="event-note" size={48} color={Colors.coolGray400} style={styles.noEventsIcon} />
                        <ThemedText style={styles.noEventsText}>
                            Inga bokade aktiviteter för närvarande
                        </ThemedText>
                        <ThemedText style={styles.noEventsSubtext}>
                            Upptäck intressanta aktiviteter eller skapa din egen!
                        </ThemedText>
                        <View style={styles.noEventsActions}>

                            <MaterialIcons name="arrow-forward" size={16} color={Colors.coolGray600} style={styles.actionArrow} />
                        </View>
                    </View>
                </TouchableOpacity>
            )}
        </ThemedView>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    container: {
        padding: 16,
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
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        marginTop: 12,
        paddingVertical: 50,
        paddingHorizontal: 16,
        backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.6)',
    },
    noEventsIcon: {
        marginVertical: 12,
        opacity: 0.6,
    },
    noEventsText: {
        fontSize: 16,
        color: Colors.coolGray500,
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    noEventsSubtext: {
        fontSize: 14,
        color: Colors.coolGray400,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    noEventsActions: {
        flexDirection: 'row',
        gap: 12,
    },
    createAltButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'transparent',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary500,
        gap: 8,
    },
    createAltButtonText: {
        color: Colors.primary500,
        fontSize: 14,
        fontWeight: '500',
    },
    newsSection: {
        marginTop: 24,
    },
    // Side by side action cards
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    actionCard: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    equalWidth: {
        flex: 1,
    },
    fullWidthSingle: {
        flex: 1,
    },
    fullWidth: {
        flex: 2, // Take up full width when no last minute section
    },
    lastMinuteCard: {
        backgroundColor: colorScheme === 'dark' ? Colors.amber900 : Colors.amber100,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.amber800 : Colors.amber200,
    },
    createCard: {
        backgroundColor: colorScheme === 'dark' ? Colors.primary900 : Colors.primary50,
    },
    actionContent: {
        alignItems: 'center',
        gap: 4,
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    createTitle: {
        textAlign: 'center',
        color: colorScheme === 'dark' ? Colors.primary300 : Colors.primary600,
    },
    lastMinuteTitle: {
        textAlign: 'center',
        color: colorScheme === 'dark' ? Colors.amber300 : Colors.amber600,
    },
    createDescription: {
        fontSize: 12,
        color: colorScheme === 'dark' ? Colors.primary200 : Colors.primary700,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 1,
    },
    lastMinuteDescription: {
        fontSize: 12,
        color: colorScheme === 'dark' ? Colors.amber200 : Colors.amber700,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 1,
    },
    actionArrow: {
        opacity: 0.6,
    },
    // Legacy styles (can be removed if not used elsewhere)
    createSection: {
        marginTop: 10,
        backgroundColor: colorScheme === 'dark' ? Colors.primary900 : Colors.primary50,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8
    },
    createContent: {
        alignItems: 'center',
        gap: 4,
    },
    createArrow: {
        opacity: 0.6,
    },
    shortcutsSection: {
        marginTop: 10
    },
    shortcutsTitle: {
        marginBottom: 0,
    },
    shortcutsGrid: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 10,
    },
    shortcutButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    lastMinuteSection: {
        backgroundColor: colorScheme === 'dark' ? Colors.amber900 : Colors.amber100,
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.amber800 : Colors.amber200,
    },
    lastMinuteContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 6
    },
    lastMinuteLeft: {
        flex: 1,
    },
    lastMinuteArrow: {
        marginLeft: 8,
    },
});

export default ParentEventDashboard;