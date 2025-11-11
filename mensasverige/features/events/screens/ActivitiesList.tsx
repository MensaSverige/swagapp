import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    useColorScheme,
    RefreshControl,
} from 'react-native';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import EventCardModal from '../components/ExternalEventCardModal';
import GroupedEventsList from '../components/GroupedEventsList';
import CreateEventModal from '../components/CreateEventModal';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { MaterialIcons } from '@expo/vector-icons';
import { useScheduleEventsWithFilter } from '../hooks/useFilteredEvents';
import { EventFilter, EventFilterOptions } from '../components/EventFilter';
import { FilterButton } from '../components/FilterButton';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, router } from 'expo-router';

interface ActivitiesListProps {
    initialFilter?: EventFilterOptions;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ initialFilter }) => {
    const { user } = useStore();
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    
    // Get URL parameters
    const params = useLocalSearchParams();
    
    // Helper function to parse current URL parameters into filter object
    const parseURLParams = useCallback((currentParams: typeof params): EventFilterOptions => {
        console.log('Parsing URL params:', currentParams);
        
        // Parse URL parameters into filter object
        const urlFilter: EventFilterOptions = {
            attending: currentParams.attending === 'true' ? true : currentParams.attending === 'false' ? false : null,
            bookable: currentParams.bookable === 'true' ? true : currentParams.bookable === 'false' ? false : null,
            official: currentParams.official === 'true' ? true : currentParams.official === 'false' ? false : null,
            categories: currentParams.categories ? String(currentParams.categories).split(',').filter(Boolean) : [],
            dateFrom: currentParams.dateFrom ? new Date(String(currentParams.dateFrom)) : null,
            dateTo: currentParams.dateTo ? new Date(String(currentParams.dateTo)) : null,
        };
        
        console.log('Parsed filter:', urlFilter);
        
        // Return URL filter if any parameters exist, otherwise default
        const hasParams = Object.values(currentParams).some(Boolean);
        return hasParams ? urlFilter : { attending: null, bookable: null, official: null, categories: [], dateFrom: null, dateTo: null };
    }, []);
    
    // Determine initial filter from props, URL params, or default
    const getInitialFilter = useCallback((): EventFilterOptions => {
        if (initialFilter) {
            return initialFilter;
        }
        
        return parseURLParams(params);
    }, [initialFilter, params, parseURLParams]);
    
    const [eventFilter, setEventFilter] = useState<EventFilterOptions>(getInitialFilter());

    // Reset filter when URL parameters change (e.g., from shortcut navigation)
    useEffect(() => {
        const newFilter = parseURLParams(params);
        console.log('Setting new filter from URL params:', newFilter);
        setEventFilter(newFilter);
    }, [params.attending, params.bookable, params.official, params.categories, params.dateFrom, params.dateTo, parseURLParams]);

    console.log('Current eventFilter state:', eventFilter);

    const { groupedEvents, nextEvent, loading, filteredEventsCount, totalEventsCount, refetch } = useScheduleEventsWithFilter(eventFilter);

    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    const handlePress = useCallback((event: Event) => {
        setSelectedEvent(event);
    }, []);

    const handleApplyFilter = useCallback((filter: EventFilterOptions) => {
        setEventFilter(filter);
    }, []);

    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const handleCreateEvent = useCallback(() => {
        setShowCreateForm(true);
    }, []);

    const handleEventCreated = useCallback((event: Event) => {
        setShowCreateForm(false);
        setShowSuccessMessage(true);
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccessMessage(false), 3000);
        // Refresh the events list to show the new event
        refetch();
        // Optionally show the created event details after a brief delay
        setTimeout(() => setSelectedEvent(event), 500);
    }, [refetch]);

    const handleCancelCreate = useCallback(() => {
        setShowCreateForm(false);
    }, []);

    const isFilterActive = () => {
        return (
            eventFilter.attending !== null ||
            eventFilter.bookable !== null ||
            eventFilter.official !== null ||
            (eventFilter.categories && eventFilter.categories.length > 0) ||
            eventFilter.dateFrom !== null ||
            eventFilter.dateTo !== null
        );
    };

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
            
            {/* Create Event Modal */}
            <CreateEventModal
                visible={showCreateForm}
                onClose={handleCancelCreate}
                onEventCreated={handleEventCreated}
            />
            
            <View style={styles.header}>
                <ThemedText type="title">Aktiviteter</ThemedText>
                <View style={styles.headerActions}>
                    {filteredEventsCount !== totalEventsCount && (
                        <Text style={styles.filterCount}>
                            Visar {filteredEventsCount} av {totalEventsCount} aktiviteter
                        </Text>
                    )}
                    <FilterButton
                        onPress={() => setShowFilter(true)}
                        isActive={isFilterActive()}
                        icon="filter-list"
                    />
                    {nextEvent && (
                        <TouchableOpacity
                            onPress={scrollToCurrentEvent}
                            style={styles.scrollToButton}
                        >
                            <MaterialIcons 
                                name="update" 
                                size={24} 
                                color={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600} 
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            {/* Success Message */}
            {showSuccessMessage && (
                <View style={styles.successMessage}>
                    <MaterialIcons name="check-circle" size={20} color="#059669" />
                    <Text style={styles.successMessageText}>Event skapat!</Text>
                </View>
            )}
            <ScrollView 
                ref={scrollViewRef} 
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={handleRefresh}
                        tintColor={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600}
                    />
                }
            >

                {!groupedEvents || Object.keys(groupedEvents).length === 0 && !loading && (
                    <View style={styles.noEventsContainer}>
                        <MaterialIcons name="event-note" size={48} color={colorScheme === 'dark' ? Colors.coolGray500 : Colors.coolGray400} style={styles.noEventsIcon} />
                        <Text style={styles.noEventsText}>Inga aktiviteter hittades</Text>
                        <Text style={styles.noEventsSubtext}>
                            {isFilterActive() 
                                ? 'Prova att justera dina filter eller skapa en egen aktivitet!' 
                                : 'Bli den första att skapa en aktivitet och bjud in andra!'}
                        </Text>
                    </View>
                )}

                <GroupedEventsList
                    groupedEvents={groupedEvents}
                    onEventPress={handlePress}
                    nextEvent={nextEvent}
                    nextEventMarkerRef={nextEventMarkerRef}
                    showCategories={true}
                    dateHeaderStyle="aligned"
                />
            </ScrollView>
            
            {/* Create Event Button */}
            {!showCreateForm && (
                <View style={styles.createButtonContainer}>
                    <ThemedButton
                        text="✨ Skapa din aktivitet"
                        variant="primary"
                        onPress={handleCreateEvent}
                    />
                </View>
            )}
            
            {user && !user.isMember && (
                <NonMemberInfo />
            )}
            
            {/* Side Filter Menu - rendered last to appear on top */}
            <EventFilter
                visible={showFilter}
                onClose={() => setShowFilter(false)}
                onApplyFilter={handleApplyFilter}
                currentFilter={eventFilter}
            />
        </ThemedView>
    );
}

const createStyles = (colorScheme: string) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        paddingLeft: 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 15,
    },
    filterCount: {
        fontSize: 12,
        color: colorScheme === 'dark' ? Colors.coolGray400 : Colors.coolGray500,
        fontWeight: '500',
    },
    scrollToButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        color: colorScheme === 'dark' ? Colors.coolGray400 : Colors.coolGray500,
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    noEventsIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    noEventsText: {
        fontSize: 18,
        color: colorScheme === 'dark' ? Colors.coolGray400 : Colors.coolGray500,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    noEventsSubtext: {
        fontSize: 14,
        color: colorScheme === 'dark' ? Colors.coolGray500 : Colors.coolGray600,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    createButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        paddingBottom: 20,
    },
    successMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 8,
        gap: 8,
    },
    successMessageText: {
        color: '#065F46',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ActivitiesList;