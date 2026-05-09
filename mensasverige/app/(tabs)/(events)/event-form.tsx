import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import CreateEventCard from '@/features/events/components/CreateEventCard';
import { useEvents } from '@/features/events/hooks/useEvents';
import { ExtendedEvent } from '@/features/events/types/eventUtilTypes';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useToast } from '@/hooks/useToast';

export default function EventFormScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { allEvents, addOrUpdateEvent } = useEvents();
    const bottom = useBottomTabOverflow();
    const colorScheme = useColorScheme();
    const { showToast, ToastComponent } = useToast(colorScheme === 'dark' ? 'dark' : 'light');

    const event = useMemo(
        () => (id ? allEvents.find(e => e.id === id) ?? null : null),
        [allEvents, id]
    );

    const handleEventSaved = useCallback((savedEvent: ExtendedEvent) => {
        addOrUpdateEvent(savedEvent);
        showToast('Aktivitet sparad!', 'success');
        setTimeout(() => router.back(), 800);
    }, [addOrUpdateEvent, router, showToast]);

    if (id && !event) {
        return (
            <ThemedView style={styles.notFound}>
                <Stack.Screen options={{ title: 'Redigera aktivitet' }} />
                <MaterialIcons name="event-busy" size={48} color={Colors.coolGray400} />
                <ThemedText style={styles.notFoundText}>Aktiviteten hittades inte</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: event ? 'Redigera aktivitet' : 'Skapa aktivitet' }} />
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 + bottom }}>
                <CreateEventCard
                    existingEvent={event ?? undefined}
                    onEventCreated={handleEventSaved}
                    onEventUpdated={handleEventSaved}
                    onCancel={() => router.back()}
                />
            </ScrollView>
            {ToastComponent}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
