import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    useColorScheme
} from 'react-native';
import { Event } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import EventCardModal from '../components/ExternalEventCardModal';
import GroupedEventsList from '../components/GroupedEventsList';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useScheduleEventsWithFilter } from '../hooks/useFilteredEvents';
import { EventFilter, EventFilterOptions } from '../components/EventFilter';
import { FilterButton } from '../components/FilterButton';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';

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
        };
        
        console.log('Parsed filter:', urlFilter);
        
        // Return URL filter if any parameters exist, otherwise default
        const hasParams = Object.values(currentParams).some(Boolean);
        return hasParams ? urlFilter : { attending: null, bookable: null, official: null, categories: [] };
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
    }, [params.attending, params.bookable, params.official, params.categories, parseURLParams]);

    console.log('Current eventFilter state:', eventFilter);

    const { groupedEvents, nextEvent, loading, filteredEventsCount, totalEventsCount } = useScheduleEventsWithFilter(eventFilter);

    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    const handlePress = useCallback((event: Event) => {
        setSelectedEvent(event);
    }, []);

    const handleApplyFilter = useCallback((filter: EventFilterOptions) => {
        setEventFilter(filter);
    }, []);

    const isFilterActive = () => {
        return (
            eventFilter.attending !== null ||
            eventFilter.bookable !== null ||
            eventFilter.official !== null ||
            (eventFilter.categories && eventFilter.categories.length > 0)
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
            <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
                {loading && (
                    <View style={styles.loadingIndicator}>
                        <ActivityIndicator 
                            size="large" 
                            color={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600} 
                        />
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
                    dateHeaderStyle="aligned"
                />
            </ScrollView>
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
        paddingVertical: 40,
    },
    noEventsText: {
        fontSize: 16,
        color: colorScheme === 'dark' ? Colors.coolGray400 : Colors.coolGray500,
    },
});

export default ActivitiesList;