import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { fetchExternalRoot } from '../services/eventService';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParentEventDetails from './ParentEventDetails';
import GroupedEventsList from './GroupedEventsList';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useEvents } from '../hooks/useEvents';
import { navigateToUserEvents, navigateToBookableEvents, navigateToLastMinuteEvents } from '../utilities/navigationUtils';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { router } from 'expo-router';
import useStore from '@/features/common/store/store';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const INFO_SHORTCUTS: Array<{
    id: string; label: string; icon: MaterialIconName;
    iconColor: string; bgLight: string; bgDark: string;
    section?: string;
}> = [
    { id: 'ankomst', label: 'SWAG Guide',  icon: 'info',     iconColor: Colors.teal600,  bgLight: Colors.teal100,   bgDark: Colors.teal900  },
    { id: 'buddies',   label: 'SWAG Buddies', icon: 'favorite', iconColor: '#E91E8C',       bgLight: '#FCE4EF',        bgDark: '#4A1028',       section: 'buddies' },
    { id: 'kontakt',    label: 'Kontakt',      icon: 'phone',    iconColor: Colors.amber600,    bgLight: Colors.amber100,    bgDark: Colors.amber900,    section: 'kontakt' },
];

const ParentEventDashboard = () => {
    const colorScheme = useColorScheme();
    const styles = createStyles(colorScheme ?? 'light');
    const {eventInfo, eventInfoLoading, setEventInfo, setEventInfoLoading, user} = useStore();

    const {
        dashboardGroupedEvents,
        loading: eventsLoading,
        lastMinuteEvents
    } = useEvents();

    useEffect(() => {
        const loadParentEventInfo = async () => {
            try {
                setEventInfoLoading(true);
                const parentEventInfo = await fetchExternalRoot();
                setEventInfo(parentEventInfo);
            } catch (error) {
                console.error('Error loading parent event info:', error);
                setEventInfo(null);
            } finally {
                setEventInfoLoading(false);
            }
        };

        loadParentEventInfo();
    }, []);

    const loading = eventInfoLoading || eventsLoading;

    const navigateToFullSchedule = () => {
        navigateToUserEvents(user?.userId);
    };

    const navigateToAllEvents = () => {
        navigateToBookableEvents();
    };

    const handleEventPress = (event: ExtendedEvent) => {
        router.push({ pathname: '/(tabs)/(home)/[id]', params: { id: event.id } });
    };

    if (loading && !eventInfo) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Laddar...</ThemedText>
            </ThemedView>
        );
    }

    if (!eventInfo) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="subtitle">Inga pågående evenemang</ThemedText>
                <ThemedText style={styles.noEventText}>
                    Det finns för närvarande inga stora evenemang eller träffar planerade.
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ParentEventDetails />

            {/* SWAG Guide Info Shortcuts */}
            <View style={styles.infoSection}>
                <View style={styles.infoGrid}>
                    {INFO_SHORTCUTS.map(shortcut => (
                        <TouchableOpacity
                            key={shortcut.id}
                            style={[
                                styles.infoCard,
                                { backgroundColor: colorScheme === 'dark' ? shortcut.bgDark : shortcut.bgLight },
                            ]}
                            onPress={() => router.push({ pathname: '/(tabs)/(home)/guide' as any, params: shortcut.section ? { initialSection: shortcut.section } : {} })}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name={shortcut.icon} size={22} color={shortcut.iconColor} />
                            <ThemedText style={styles.infoCardLabel}>{shortcut.label}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Last Minute and Create Activity Side by Side */}
            <View style={styles.actionsRow}>
                {lastMinuteEvents.length > 0 && (
                    <TouchableOpacity
                        style={[
                            styles.actionCard,
                            styles.lastMinuteCard,
                            styles.equalWidth
                        ]}
                        onPress={navigateToLastMinuteEvents}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionContent}>
                            <View style={styles.titleContainer}>
                                <MaterialIcons name="downhill-skiing" size={20} color={colorScheme === 'dark' ? Colors.amber300 : Colors.amber600} />
                                <ThemedText type="subtitle" style={styles.lastMinuteTitle}>Sista minuten</ThemedText>
                            </View>
                            <ThemedText style={styles.lastMinuteDescription}>
                                Hinner du med? {lastMinuteEvents.length} {lastMinuteEvents.length === 1 ? 'aktivitet' : 'aktiviteter'} startar snart!
                            </ThemedText>
                            <MaterialIcons name="arrow-forward" size={16} color={colorScheme === 'dark' ? Colors.amber400 : Colors.amber700} style={styles.actionArrow} />
                        </View>
                    </TouchableOpacity>
                )}

                {Object.keys(dashboardGroupedEvents).length !== 0 && eventInfo && (
                    <TouchableOpacity
                        style={[
                            styles.actionCard,
                            styles.createCard,
                            lastMinuteEvents.length > 0 ? styles.equalWidth : styles.fullWidthSingle
                        ]}
                        onPress={() => router.push({ pathname: '/(tabs)/(events)/event-form' })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionContent}>
                            <View style={styles.titleContainer}>
                                <MaterialIcons name="celebration" size={20} color={Colors.primary300} />
                                <ThemedText type="subtitle" style={styles.createTitle}>Bjud in andra!</ThemedText>
                            </View>
                            <ThemedText style={styles.createDescription}>
                                Skapa dina egna aktiviteter och träffa nya vänner.
                            </ThemedText>
                            <MaterialIcons name="arrow-forward" size={16} color={Colors.primary400} style={styles.actionArrow} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Upcoming Events Section */}
            {Object.keys(dashboardGroupedEvents).length > 0 && (
                <View style={styles.eventsSection}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <MaterialIcons name="event-available" size={20} color={Colors.primary600} />
                            <ThemedText type="subtitle">Mina bokningar</ThemedText>
                        </View>
                        <TouchableOpacity
                            onPress={navigateToFullSchedule}
                            style={styles.seeAllButton}
                        >
                            <ThemedText style={styles.seeAllText}>Se alla</ThemedText>
                            <MaterialIcons name="chevron-right" size={16} color={Colors.primary400} />
                        </TouchableOpacity>
                    </View>

                    <GroupedEventsList
                        groupedEvents={dashboardGroupedEvents}
                        onEventPress={handleEventPress}
                        showCategories={true}
                        dateHeaderStyle="default"
                    />
                </View>
            )}

            {/* No upcoming events message */}
            {!loading && Object.keys(dashboardGroupedEvents).length === 0 && eventInfo && (
                <TouchableOpacity onPress={navigateToAllEvents}>
                    <View style={[styles.noEventsContainer, styles.actionCard]}>
                        <MaterialIcons name="event-note" size={48} color={Colors.coolGray400} style={styles.noEventsIcon} />
                        <ThemedText style={styles.noEventsText}>
                            Inga bokade aktiviteter för närvarande
                        </ThemedText>
                        <ThemedText style={styles.noEventsSubtext}>
                            Upptäck intressanta aktiviteter eller skapa din egen!
                        </ThemedText>
                        <View style={styles.noEventsActions}>
                            <MaterialIcons name="arrow-forward" size={16} color={Colors.coolGray600} style={styles.actionArrow} />
                        </View>
                    </View>
                </TouchableOpacity>
            )}
        </ThemedView>
    );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
    container: {
        padding: 16,
        flex: 1
    },
    loadingText: {
        textAlign: 'center',
        color: Colors.coolGray500,
        marginVertical: 20,
    },
    noEventText: {
        color: Colors.coolGray500,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    eventsSection: {
        marginTop: 24
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        color: Colors.primary400,
        fontSize: 14,
        fontWeight: '500',
    },
    noEventsContainer: {
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 50,
        paddingHorizontal: 16,
        backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.6)',
    },
    noEventsIcon: {
        marginVertical: 12,
        opacity: 0.6,
    },
    noEventsText: {
        fontSize: 16,
        color: Colors.coolGray500,
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    noEventsSubtext: {
        fontSize: 14,
        color: Colors.coolGray400,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    noEventsActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    actionCard: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    equalWidth: {
        flex: 1,
    },
    fullWidthSingle: {
        flex: 1,
    },
    fullWidth: {
        flex: 2,
    },
    lastMinuteCard: {
        backgroundColor: colorScheme === 'dark' ? Colors.amber900 : Colors.amber100,
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? Colors.amber800 : Colors.amber200,
    },
    createCard: {
        backgroundColor: colorScheme === 'dark' ? Colors.primary900 : Colors.primary50,
    },
    actionContent: {
        alignItems: 'center',
        gap: 4,
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    createTitle: {
        textAlign: 'center',
        color: colorScheme === 'dark' ? Colors.primary300 : Colors.primary600,
    },
    lastMinuteTitle: {
        textAlign: 'center',
        color: colorScheme === 'dark' ? Colors.amber300 : Colors.amber600,
    },
    createDescription: {
        fontSize: 12,
        color: colorScheme === 'dark' ? Colors.primary200 : Colors.primary700,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 1,
    },
    lastMinuteDescription: {
        fontSize: 12,
        color: colorScheme === 'dark' ? Colors.amber200 : Colors.amber700,
        lineHeight: 16,
        textAlign: 'center',
        marginBottom: 1,
    },
    actionArrow: {
        opacity: 0.6,
    },
    infoSection: {
        marginTop: 10,
    },
    infoGrid: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    infoCard: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        gap: 4,
    },
    infoCardLabel: {
        fontSize: 11,
        textAlign: 'center',
        color: colorScheme === 'dark' ? Colors.coolGray100 : Colors.coolGray800,
    },
});

export default ParentEventDashboard;
