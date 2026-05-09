import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import CreateEventCard from '@/features/events/components/CreateEventCard';
import { useEvents } from '@/features/events/hooks/useEvents';
import { ExtendedEvent } from '@/features/events/types/eventUtilTypes';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

export default function EventFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { allEvents, addOrUpdateEvent } = useEvents();
    const bottom = useBottomTabOverflow();

    const event = useMemo(
        () => (id ? allEvents.find(e => e.id === id) ?? null : null),
        [allEvents, id]
    );

    const handleEventSaved = (savedEvent: ExtendedEvent) => {
        addOrUpdateEvent(savedEvent);
        router.back();
    };

    if (id && !event) {
        return (
            <ThemedView style={styles.notFound}>
                <Stack.Screen options={{ title: 'Redigera aktivitet' }} />
                <MaterialIcons name="event-busy" size={48} color="#9CA3AF" />
                <ThemedText style={styles.notFoundText}>Aktiviteten hittades inte</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={{ flex: 1 }}>
            <Stack.Screen options={{ title: event ? 'Redigera aktivitet' : 'Skapa aktivitet' }} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 + bottom }}>
                <CreateEventCard
                    existingEvent={event ?? undefined}
                    onEventCreated={handleEventSaved}
                    onEventUpdated={handleEventSaved}
                    onCancel={() => router.back()}
                />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    notFound: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    notFoundText: {
        fontSize: 16,
        opacity: 0.6,
    },
});
