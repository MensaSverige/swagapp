import React, { useMemo, useCallback } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
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
import { Colors } from '@/constants/Colors';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { MaterialIcons } from '@expo/vector-icons';

export default function UserEventsScreen() {
    const { userId: userIdParam } = useLocalSearchParams<{ userId?: string }>();
    const { user } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const bottom = useBottomTabOverflow();

    const targetUserId = userIdParam ? Number(userIdParam) : user?.userId;
    const isOwnEvents = !targetUserId || targetUserId === user?.userId;

    const { allEvents, loading, refreshing, refetch } = useEvents({ enableAutoRefresh: true });

    const userGroupedEvents = useMemo(() => {
        const now = new Date();

        const filtered = allEvents.filter((event: ExtendedEvent) => {
            if (!event.start) return false;

            const start = new Date(event.start);
            const end = event.end ? new Date(event.end) : null;
            const isOngoing = end ? start <= now && end >= now : false;
            if (start < now && !isOngoing) return false;

            if (isOwnEvents) {
                return event.attendingOrHost;
            }
            return (
                event.hosts?.some(h => h.userId === targetUserId) ||
                (event.admin?.includes(targetUserId!) ?? false)
            );
        });

        return groupEventsByDate(sortEventsByDate(filtered));
    }, [allEvents, targetUserId, isOwnEvents]);

    const handleEventPress = useCallback((event: ExtendedEvent) => {
        router.push({ pathname: '/events/[id]', params: { id: event.id } });
    }, [router]);

    const isEmpty = Object.keys(userGroupedEvents).length === 0;

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
                        dateHeaderStyle="default"
                    />
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
});
