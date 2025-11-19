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
import UnifiedEventModal from '../components/UnifiedEventModal';
import GroupedEventsList from '../components/GroupedEventsList';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { MaterialIcons } from '@expo/vector-icons';
import { useEvents } from '../hooks/useEvents';
import { EventFilter } from '../components/EventFilter';
import { EventFilterOptions } from '../store/EventsSlice';
import { FilterButton } from '../components/FilterButton';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, router } from 'expo-router';
import { ExtendedEvent } from '../types/eventUtilTypes';

interface ActivitiesListProps {
    initialFilter?: EventFilterOptions;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ initialFilter }) => {
    const { user } = useStore();
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const [selectedEvent, setSelectedEvent] = useState<ExtendedEvent | null>(null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    
    const params = useLocalSearchParams();
    
    const parseURLParams = useCallback((currentParams: typeof params): EventFilterOptions => {
        const urlFilter: EventFilterOptions = {
            attendingOrHost: currentParams.attendingOrHost === 'true' ? true : currentParams.attendingOrHost === 'false' ? false : null,
            bookable: currentParams.bookable === 'true' ? true : currentParams.bookable === 'false' ? false : null,
            official: currentParams.official === 'true' ? true : currentParams.official === 'false' ? false : null,
            categories: currentParams.categories ? String(currentParams.categories).split(',').filter(Boolean) : [],
            dateFrom: currentParams.dateFrom ? new Date(String(currentParams.dateFrom)) : null,
            dateTo: currentParams.dateTo ? new Date(String(currentParams.dateTo)) : null,
        };

        const hasParams = Object.values(currentParams).some(Boolean);
        return hasParams ? urlFilter : { attendingOrHost: null, bookable: null, official: null, categories: [], dateFrom: null, dateTo: null };
    }, []);
    
    const getInitialFilter = useCallback((): EventFilterOptions => {
        if (initialFilter) {
            return initialFilter;
        }
        
        return parseURLParams(params);
    }, [initialFilter, params, parseURLParams]);
    
    const [eventFilter, setEventFilter] = useState<EventFilterOptions>(getInitialFilter());

    useEffect(() => {
        const newFilter = parseURLParams(params);
        setEventFilter(newFilter);
    }, [params.attendingOrHost, params.bookable, params.official, params.categories, params.dateFrom, params.dateTo, parseURLParams]);

    const { 
        filteredGroupedEvents, 
        loading, 
        filteredCount, 
        filteredTotalCount, 
        refetch,
        setCurrentEventFilter,
        addOrUpdateEvent
    } = useEvents({ enableAutoRefresh: true});

    useEffect(() => {
        setCurrentEventFilter(eventFilter);
    }, [eventFilter, setCurrentEventFilter]);

    const scrollViewRef = useRef<ScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    const handlePress = useCallback((event: ExtendedEvent) => {
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

    const handleEventSaved = useCallback((event: ExtendedEvent) => {
        setShowCreateForm(false);
        setShowSuccessMessage(true);

        setTimeout(() => setShowSuccessMessage(false), 3000);
        addOrUpdateEvent(event);
    }, [addOrUpdateEvent]);

    const handleCancelCreate = useCallback(() => {
        setShowCreateForm(false);
    }, []);

    const isFilterActive = () => {
        return (
            eventFilter.attendingOrHost !== null ||
            eventFilter.bookable !== null ||
            eventFilter.official !== null ||
            (eventFilter.categories && eventFilter.categories.length > 0) ||
            eventFilter.dateFrom !== null ||
            eventFilter.dateTo !== null
        );
    };

    return (
        <ThemedView useSafeArea={true} style={{ flex: 1 }}>
            <UnifiedEventModal
                event={selectedEvent || undefined}
                open={!!selectedEvent || showCreateForm}
                mode={showCreateForm ? 'create' : 'view'}
                onClose={() => {
                    setSelectedEvent(null);
                    setShowCreateForm(false);
                }}
                onEventUpdated={handleEventSaved}
                onEventCreated={handleEventSaved}
            />
            
            <View style={styles.header}>
                <ThemedText type="title">Aktiviteter</ThemedText>
                <View style={styles.headerActions}>
                    {filteredCount !== filteredTotalCount && (
                        <Text style={styles.filterCount}>
                            Visar {filteredCount} av {filteredTotalCount} aktiviteter
                        </Text>
                    )}
                    <FilterButton
                        onPress={() => setShowFilter(true)}
                        isActive={isFilterActive()}
                        icon="filter-list"
                    />
                </View>
            </View>
            
            {showSuccessMessage && (
                <View style={styles.successMessage}>
                    <MaterialIcons name="check-circle" size={20} color="#059669" />
                    <Text style={styles.successMessageText}>Event sparat!</Text>
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

                {!filteredGroupedEvents || Object.keys(filteredGroupedEvents).length === 0 && !loading && (
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
                    groupedEvents={filteredGroupedEvents}
                    onEventPress={handlePress}
                    nextEventMarkerRef={nextEventMarkerRef}
                    showCategories={true}
                    dateHeaderStyle="aligned"
                />
            </ScrollView>
            
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