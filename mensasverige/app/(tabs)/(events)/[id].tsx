import React, { useCallback, useMemo } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import UnifiedEventCard from '@/features/events/components/UnifiedEventCard';
import { useEvents } from '@/features/events/hooks/useEvents';
import { canUserEditEvent } from '@/features/events/utils/eventPermissions';
import useStore from '@/features/common/store/store';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useStore();
    const { allEvents } = useEvents();
    const iconColor = useThemeColor({}, 'icon');
    const bottom = useBottomTabOverflow();
    const router = useRouter();

    const event = useMemo(
        () => allEvents.find(e => e.id === id) ?? null,
        [allEvents, id]
    );

    const canEdit = useMemo(
        () => !!event && canUserEditEvent(event, user),
        [event, user]
    );

    const headerRight = useCallback(() => (
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/(tabs)/(events)/event-form', params: { id } })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <MaterialIcons name="edit" size={22} color={iconColor} />
        </TouchableOpacity>
    ), [iconColor, router, id]);

    if (!event) {
        return (
            <ThemedView style={styles.notFound}>
                <Stack.Screen options={{ title: 'Aktivitet' }} />
                <MaterialIcons name="event-busy" size={48} color="#9CA3AF" />
                <ThemedText style={styles.notFoundText}>Aktiviteten hittades inte</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: event.name ?? 'Aktivitet',
                    headerRight: canEdit ? headerRight : undefined,
                }}
            />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 + bottom }}>
                <UnifiedEventCard event={event} />
            </ScrollView>
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
