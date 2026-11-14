import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    SectionList,
    View,
    Text,
    StyleSheet,
    useColorScheme,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { useEvents } from '../hooks/useEvents';
import { EventFilter } from '../components/EventFilter';
import { EventFilterOptions } from '../store/EventsSlice';
import { FilterButton } from '../components/FilterButton';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import EventListItem from '../components/EventListItem';
import { countUpcomingEvents, displayLocaleTimeStringDate, filterByOptions, groupEventsByDate } from '../utils/eventUtils';
import { selectActivityListEvents } from '../utils/mainEventUtils';
import EventHeader from '../components/EventHeader';
import { setMainEventAttendance, useLocalEvents, useSelectedMainEvent } from '../hooks/useMainEvents';
import { BUTTON_HEIGHT, DIVIDER_COLOR, PAGE_PADDING, typeScale } from '../styles/typeScale';

interface ActivitiesListProps {
    initialFilter?: EventFilterOptions;
}

type EventSection = { title: string; data: ExtendedEvent[] };

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ initialFilter }) => {
    const { user } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const styles = useMemo(() => createStyles(colorScheme ?? 'light'), [colorScheme]);
    const bottom = useBottomTabOverflow();
    const [showFilter, setShowFilter] = useState(false);
    const [registering, setRegistering] = useState(false);
    const { selectedMainEvent, selectedMainEventId } = useSelectedMainEvent();
    const locked = !!selectedMainEvent && !selectedMainEvent.attending;

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
        allEvents,
        loading,
        refreshing,
        refetch,
        setCurrentEventFilter,
    } = useEvents({ enableAutoRefresh: true });
    const localEvents = useLocalEvents();

    useEffect(() => {
        setCurrentEventFilter(eventFilter);
    }, [eventFilter, setCurrentEventFilter]);

    // A main event's programme while it is selected; otherwise local events and
    // activities without a main event. Filters apply within that scope.
    const listEvents = useMemo(
        () => selectActivityListEvents(allEvents, localEvents, selectedMainEventId),
        [allEvents, localEvents, selectedMainEventId]
    );
    const filteredEvents = useMemo(() => filterByOptions(listEvents, eventFilter), [listEvents, eventFilter]);
    const filteredCount = filteredEvents.length;
    const filteredTotalCount = useMemo(() => countUpcomingEvents(listEvents), [listEvents]);

    const sections = useMemo<EventSection[]>(() => {
        const grouped = groupEventsByDate(filteredEvents);
        return Object.keys(grouped).map(date => ({ title: date, data: grouped[date] }));
    }, [filteredEvents]);

    const handleRegister = useCallback(async () => {
        if (!selectedMainEventId || registering) return;
        setRegistering(true);
        try {
            await setMainEventAttendance(selectedMainEventId, true);
        } catch {
            Alert.alert('Något gick fel', 'Det gick inte att anmäla dig. Försök igen.');
        } finally {
            setRegistering(false);
        }
    }, [selectedMainEventId, registering]);

    const isFilterActive = useMemo(() =>
        eventFilter.attendingOrHost !== null ||
        eventFilter.bookable !== null ||
        eventFilter.official !== null ||
        (eventFilter.categories?.length ?? 0) > 0 ||
        eventFilter.dateFrom !== null ||
        eventFilter.dateTo !== null,
        [eventFilter]
    );

    const handlePress = useCallback((event: ExtendedEvent) => {
        router.push({ pathname: '/events/[id]', params: { id: event.id } });
    }, [router]);

    const handleApplyFilter = useCallback((filter: EventFilterOptions) => {
        setEventFilter(filter);
    }, []);

    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const renderItem = useCallback(({ item, index }: { item: ExtendedEvent; index: number }) => (
        <EventListItem
            event={item}
            onPress={handlePress}
            showCategories={true}
            isFirstEventOfDay={index === 0}
        />
    ), [handlePress]);

    const renderSectionHeader = useCallback(({ section }: { section: EventSection }) => (
        <View>
            <ThemedText style={styles.dateHeaderAligned}>
                {displayLocaleTimeStringDate(section.title)}
            </ThemedText>
            <View style={styles.divider} />
        </View>
    ), [styles]);

    const listHeader = useMemo(() => loading ? (
        <ActivityIndicator
            style={styles.initialLoader}
            size="large"
            color={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600}
        />
    ) : null, [loading, styles, colorScheme]);

    const listEmpty = useMemo(() => !loading && !refreshing ? (
        <View style={styles.noEventsContainer}>
            <MaterialIcons name="event-note" size={48} color={colorScheme === 'dark' ? Colors.coolGray500 : Colors.coolGray400} style={styles.noEventsIcon} />
            <Text style={styles.noEventsText}>Inga aktiviteter hittades</Text>
            <Text style={styles.noEventsSubtext}>
                {isFilterActive
                    ? 'Prova att justera dina filter eller skapa en egen aktivitet!'
                    : 'Bli den första att skapa en aktivitet och bjud in andra!'}
            </Text>
        </View>
    ) : null, [loading, refreshing, isFilterActive, styles, colorScheme]);

    const filterButton = (
        <FilterButton
            onPress={() => setShowFilter(true)}
            isActive={isFilterActive}
            icon="filter-list"
        />
    );

    return (
        <ThemedView style={{ flex: 1 }}>
            <EventHeader />
            {selectedMainEvent ? (
                <View style={styles.eventTitleRow}>
                    <ThemedText style={styles.h1}>Aktiviteter</ThemedText>
                    {!locked && filterButton}
                </View>
            ) : (
                <View style={styles.header}>
                    <ThemedText type="title">Aktiviteter</ThemedText>
                    <View style={styles.headerActions}>
                        {filteredCount !== filteredTotalCount && (
                            <Text style={styles.filterCount}>
                                {filteredCount} / {filteredTotalCount}
                            </Text>
                        )}
                        {filterButton}
                    </View>
                </View>
            )}

            {locked ? (
                <View style={styles.lockedWrapper}>
                    <View style={styles.lockedContainer}>
                        <MaterialIcons name="lock" size={40} color="#9CA3AF" style={styles.lockedIcon} />
                        <ThemedText style={styles.lockedTitle}>Aktiviteterna visas när du är anmäld</ThemedText>
                        <ThemedText style={styles.lockedText}>
                            Då ser du programmet, kan boka aktiviteter och se vilka som kommer, även på kartan.
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.registerButton, registering && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={registering}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                    >
                        <Text style={styles.createButtonText}>{registering ? 'Anmäler...' : 'Anmäl mig!'}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600}
                            />
                        }
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={listEmpty}
                        contentContainerStyle={{ paddingBottom: 80 + bottom }}
                        stickySectionHeadersEnabled={false}
                        initialNumToRender={12}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        removeClippedSubviews={true}
                    />

                    <View style={{...styles.createButtonContainer, paddingBottom: styles.createButtonContainer.paddingBottom + bottom}}>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push({ pathname: '/(tabs)/(events)/event-form' })}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Skapa aktivitet"
                        >
                            <MaterialIcons name="add" size={24} color="#FFFFFF" />
                            <Text style={styles.createButtonText}>Skapa aktivitet</Text>
                        </TouchableOpacity>
                    </View>
                </>
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
    eventTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 50,
        paddingLeft: PAGE_PADDING,
        paddingRight: 7,
        marginTop: 8,
    },
    h1: {
        ...typeScale.h1,
    },
    dateHeaderAligned: {
        ...typeScale.h3,
        paddingHorizontal: PAGE_PADDING,
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.coolGray700 : DIVIDER_COLOR,
        marginBottom: 8,
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
    initialLoader: {
        marginTop: 60,
    },
    createButton: {
        height: BUTTON_HEIGHT,
        borderRadius: 10,
        backgroundColor: '#005DB4',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonText: {
        ...typeScale.button,
        color: '#FFFFFF',
    },
    registerButton: {
        height: BUTTON_HEIGHT,
        borderRadius: 10,
        backgroundColor: '#005DB4',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    lockedWrapper: {
        paddingHorizontal: PAGE_PADDING,
    },
    lockedContainer: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 32,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: colorScheme === 'dark' ? Colors.coolGray800 : '#F3F4F6',
    },
    lockedIcon: {
        marginBottom: 12,
    },
    lockedTitle: {
        ...typeScale.h3,
        color: colorScheme === 'dark' ? Colors.coolGray200 : '#374151',
        textAlign: 'center',
        marginBottom: 8,
    },
    lockedText: {
        ...typeScale.meta,
        color: colorScheme === 'dark' ? Colors.coolGray400 : '#4B5563',
        textAlign: 'center',
    },
    createButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        paddingBottom: 20,
    },
});

export default ActivitiesList;
