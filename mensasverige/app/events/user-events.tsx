import React, { useMemo, useCallback } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import useStore from '@/features/common/store/store';
import { useEvents } from '@/features/events/hooks/useEvents';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import GroupedEventsList from '@/features/events/components/GroupedEventsList';
import { ExtendedEvent } from '@/features/events/types/eventUtilTypes';
import { groupEventsByDate, sortEventsByDate } from '@/features/events/utils/eventUtils';
import { getMainEventChildren, isEventOver, selectMyBookings } from '@/features/events/utils/mainEventUtils';
import { Colors } from '@/constants/Colors';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { MaterialIcons } from '@expo/vector-icons';
import { PAGE_PADDING, themeColors, typeScale } from '@/features/events/styles/typeScale';

/**
 * A member's bookings: only those, as their own page. Opened from "Se alla"
 * under Mina bokningar, scoped to that main event (`parent`). From here the
 * whole programme is one tap away in Aktiviteter.
 */
export default function UserEventsScreen() {
    const { userId: userIdParam, parent } = useLocalSearchParams<{ userId?: string; parent?: string }>();
    const { user } = useStore();
    const selectMainEvent = useStore(s => s.selectMainEvent);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const bottom = useBottomTabOverflow();

    const targetUserId = userIdParam ? Number(userIdParam) : user?.userId;
    const isOwnEvents = !targetUserId || targetUserId === user?.userId;

    const { allEvents, loading, refreshing, refetch } = useEvents({ enableAutoRefresh: true });

    const userGroupedEvents = useMemo(() => {
        // On one main event: the same bookings the riksträff page previews.
        if (parent && isOwnEvents) {
            return groupEventsByDate(selectMyBookings(getMainEventChildren(allEvents, parent)));
        }
        const now = Date.now();
        const filtered = allEvents.filter((event: ExtendedEvent) => {
            if (!event.start || isEventOver(event, now)) return false;
            if (isOwnEvents) return event.attendingOrHost;
            return (
                event.hosts?.some(h => h.userId === targetUserId) ||
                (event.admin?.includes(targetUserId!) ?? false)
            );
        });
        return groupEventsByDate(sortEventsByDate(filtered));
    }, [allEvents, targetUserId, isOwnEvents, parent]);

    const handleEventPress = useCallback((event: ExtendedEvent) => {
        router.push({ pathname: '/events/[id]', params: { id: event.id } });
    }, [router]);

    const isEmpty = Object.keys(userGroupedEvents).length === 0;
    const link = themeColors(colorScheme === 'dark').link;

    // On to every activity: the main event's programme when scoped to one.
    const openAllActivities = useCallback(() => {
        if (parent) selectMainEvent(parent);
        router.navigate('/(tabs)/(events)');
    }, [parent, selectMainEvent, router]);

    const allActivitiesRow = isOwnEvents ? (
        <TouchableOpacity
            onPress={openAllActivities}
            style={[styles.linkRow, { borderColor: themeColors(colorScheme === 'dark').divider }]}
            accessibilityRole="link"
        >
            <ThemedText style={[styles.linkText, { color: link }]}>Alla aktiviteter</ThemedText>
            <MaterialIcons name="chevron-right" size={22} color={link} />
        </TouchableOpacity>
    ) : null;

    const refreshControl = (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600}
        />
    );

    return (
        <ThemedView style={{ flex: 1 }}>
            <Stack.Screen options={{ title: isOwnEvents ? 'Mina bokningar' : 'Bokningar' }} />
            {loading ? (
                <ActivityIndicator
                    style={styles.loader}
                    size="large"
                    color={colorScheme === 'dark' ? Colors.primary400 : Colors.primary600}
                />
            ) : isEmpty ? (
                <ScrollView
                    contentContainerStyle={[styles.emptyContainer, { paddingBottom: 80 + bottom }]}
                    refreshControl={refreshControl}
                >
                    <MaterialIcons
                        name="event-note"
                        size={48}
                        color={colorScheme === 'dark' ? Colors.coolGray500 : Colors.coolGray400}
                        style={styles.emptyIcon}
                    />
                    <ThemedText style={styles.emptyText}>
                        {isOwnEvents ? 'Du har inga bokningar ännu' : 'Inga bokningar hittades'}
                    </ThemedText>
                    <ThemedView style={styles.emptyLink}>{allActivitiesRow}</ThemedView>
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 80 + bottom }}
                    refreshControl={refreshControl}
                >
                    <GroupedEventsList
                        groupedEvents={userGroupedEvents}
                        onEventPress={handleEventPress}
                        showCategories={true}
                        dateHeaderStyle="aligned"
                    />
                    {allActivitiesRow}
                </ScrollView>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    loader: {
        marginTop: 60,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    emptyLink: {
        alignSelf: 'stretch',
        marginTop: 24,
        marginHorizontal: -20,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        paddingHorizontal: PAGE_PADDING,
        marginTop: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    linkText: {
        ...typeScale.link,
    },
});
