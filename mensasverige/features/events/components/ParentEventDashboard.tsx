import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { registerLabel } from '../utils/eventAttendance';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Event } from '../../../api_schema/types';
import GroupedEventsList from './GroupedEventsList';
import EventInfoRows from './eventPage/EventInfoRows';
import EventRegisterButton from './eventPage/EventRegisterButton';
import EventDescription from './eventPage/EventDescription';
import EventPeople from './eventPage/EventPeople';
import { useEvents } from '../hooks/useEvents';
import { useEventAttendance } from '../hooks/useEventAttendance';
import {
    navigateToLastMinuteEvents,
    navigateToUserEvents,
} from '../utilities/navigationUtils';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { groupEventsByDate } from '../utils/eventUtils';
import {
    getMainEventChildren,
    selectMyBookings,
} from '../utils/mainEventUtils';
import { PAGE_PADDING, themeColors, typeScale } from '../styles/typeScale';

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

interface ParentEventDashboardProps {
    mainEvent: Event;
}

/**
 * Information tab content for the selected main event (below the EventHeader).
 * The same event page as an activity's -- rows, description, host and
 * participants -- with the riksträff's shortcuts and programme added.
 */
const ParentEventDashboard: React.FC<ParentEventDashboardProps> = ({ mainEvent }) => {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = useMemo(() => createStyles(colorScheme), [colorScheme]);
    const { allEvents, loading: eventsLoading, lastMinuteEvents: allLastMinute } = useEvents();
    const { status, siteUrl, busy, register, unregister } = useEventAttendance(mainEvent);
    const label = registerLabel(status, siteUrl);

    const attending = !!mainEvent.attending;
    const isRoot = mainEvent.source === 'external_root';

    const children = useMemo(
        () => getMainEventChildren(allEvents, mainEvent.id),
        [allEvents, mainEvent.id],
    );
    const myBookings = useMemo(() => selectMyBookings(children).slice(0, 3), [children]);
    const myBookingsGrouped = useMemo(() => groupEventsByDate(myBookings), [myBookings]);
    const lastMinuteEvents = useMemo(
        () => allLastMinute.filter(e => e.parentEvent === mainEvent.id),
        [allLastMinute, mainEvent.id],
    );

    const handleEventPress = (event: ExtendedEvent) => {
        router.push({ pathname: '/events/[id]', params: { id: event.id } });
    };

    // Its own page with only the member's bookings here, not a filtered Aktiviteter.
    const navigateToMyBookings = () => navigateToUserEvents({ parent: mainEvent.id });

    const infoTiles = (
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
    );

    const sectionHeader = (title: string, onSeeAll: () => void) => (
        <View style={styles.sectionHeader}>
            <ThemedText style={styles.h2} accessibilityRole="header">{title}</ThemedText>
            <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
                <ThemedText style={styles.seeAllText}>Se alla</ThemedText>
            </TouchableOpacity>
        </View>
    );

    // Bookings and things to book only where there is a programme: a local
    // event has none until someone adds activities to it.
    const hasProgramme = isRoot || children.length > 0;

    return (
        <ThemedView style={styles.container}>
            <EventInfoRows event={mainEvent} status={status} siteUrl={siteUrl} busy={busy} onUnregister={unregister} />
            {!!label && <EventRegisterButton label={label} onPress={register} busy={busy} />}

            {isRoot && <View style={styles.infoSection}>{infoTiles}</View>}

            <EventDescription description={mainEvent.description} />
            <EventPeople event={mainEvent} />

            {!attending && isRoot && (
                <View style={styles.lockedContainer}>
                    <MaterialIcons name="lock" size={40} color="#9CA3AF" style={styles.lockedIcon} />
                    <ThemedText style={styles.lockedTitle}>Aktiviteterna visas när du är anmäld</ThemedText>
                    <ThemedText style={styles.lockedText}>
                        Då ser du programmet och kan boka aktiviteter.
                    </ThemedText>
                </View>
            )}

            {attending && hasProgramme && (
                <>
                    <View style={styles.actionsRow}>
                        {lastMinuteEvents.length > 0 && (
                            <TouchableOpacity
                                style={[styles.actionCard, styles.lastMinuteCard, styles.equalWidth]}
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

                        {myBookings.length > 0 && (
                            <TouchableOpacity
                                style={[styles.actionCard, styles.createCard, styles.equalWidth]}
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

                    <View style={styles.eventsSection}>
                        {sectionHeader('Mina bokningar', navigateToMyBookings)}
                        {myBookings.length > 0 ? (
                            <GroupedEventsList
                                bleed
                                groupedEvents={myBookingsGrouped}
                                onEventPress={handleEventPress}
                                showCategories={true}
                                dateHeaderStyle="default"
                            />
                        ) : (
                            !eventsLoading && (
                                <ThemedText style={styles.emptyText}>Inga bokade aktiviteter ännu</ThemedText>
                            )
                        )}
                    </View>

                </>
            )}
        </ThemedView>
    );
};

const createStyles = (colorScheme: string) => {
    const dark = colorScheme === 'dark';
    return StyleSheet.create({
        container: {
            paddingHorizontal: PAGE_PADDING,
            paddingTop: 8,
            paddingBottom: PAGE_PADDING,
            flex: 1,
        },
        h2: typeScale.h2,
        eventsSection: {
            marginTop: 24,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        seeAllButton: {
            minHeight: 44,
            justifyContent: 'center',
        },
        seeAllText: {
            ...typeScale.link,
            color: themeColors(dark).link,
        },
        emptyText: {
            ...typeScale.meta,
            color: themeColors(dark).meta,
        },
        lockedContainer: {
            alignItems: 'center',
            marginTop: 16,
            paddingVertical: 32,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: dark ? Colors.coolGray800 : '#F3F4F6',
        },
        lockedIcon: {
            marginBottom: 12,
        },
        lockedTitle: {
            ...typeScale.h3,
            color: dark ? Colors.coolGray200 : '#374151',
            textAlign: 'center',
            marginBottom: 8,
        },
        lockedText: {
            ...typeScale.meta,
            color: themeColors(dark).meta,
            textAlign: 'center',
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
        lastMinuteCard: {
            backgroundColor: dark ? Colors.amber900 : Colors.amber100,
            borderWidth: 1,
            borderColor: dark ? Colors.amber800 : Colors.amber200,
        },
        createCard: {
            backgroundColor: dark ? Colors.primary900 : Colors.primary50,
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
            color: dark ? Colors.primary300 : Colors.primary600,
        },
        lastMinuteTitle: {
            textAlign: 'center',
            color: dark ? Colors.amber300 : Colors.amber600,
        },
        createDescription: {
            fontSize: 12,
            color: dark ? Colors.primary200 : Colors.primary700,
            lineHeight: 16,
            textAlign: 'center',
            marginBottom: 1,
        },
        lastMinuteDescription: {
            fontSize: 12,
            color: dark ? Colors.amber200 : Colors.amber700,
            lineHeight: 16,
            textAlign: 'center',
            marginBottom: 1,
        },
        actionArrow: {
            opacity: 0.6,
        },
        infoSection: {
            marginTop: 12,
        },
        infoGrid: {
            flexDirection: 'row',
            gap: 8,
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
            ...typeScale.label,
            textAlign: 'center',
            color: dark ? Colors.coolGray100 : Colors.coolGray800,
        },
    });
};

export default ParentEventDashboard;
