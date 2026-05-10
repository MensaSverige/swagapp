import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    SectionList,
    View,
    Text,
    StyleSheet,
    useColorScheme,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
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
import { displayLocaleTimeStringDate } from '../utils/eventUtils';

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
        refreshing,
        filteredCount,
        filteredTotalCount,
        refetch,
        setCurrentEventFilter,
    } = useEvents({ enableAutoRefresh: true });

    useEffect(() => {
        setCurrentEventFilter(eventFilter);
    }, [eventFilter, setCurrentEventFilter]);

    const sections = useMemo<EventSection[]>(
        () => Object.keys(filteredGroupedEvents).map(date => ({
            title: date,
            data: filteredGroupedEvents[date],
        })),
        [filteredGroupedEvents]
    );

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
            <ThemedText style={styles.dateHeaderAligned} type="defaultSemiBold">
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

    return (
        <ThemedView style={{ flex: 1 }}>
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
                        isActive={isFilterActive}
                        icon="filter-list"
                    />
                </View>
            </View>

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
                <ThemedButton
                    text="✨ Skapa din aktivitet"
                    variant="primary"
                    onPress={() => router.push({ pathname: '/(tabs)/(events)/event-form' })}
                />
            </View>

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
    dateHeaderAligned: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: colorScheme === 'dark' ? Colors.coolGray700 : Colors.coolGray200,
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
    createButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        paddingBottom: 20,
    },
});

export default ActivitiesList;
