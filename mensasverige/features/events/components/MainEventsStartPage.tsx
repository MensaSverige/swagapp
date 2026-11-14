import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Event } from '../../../api_schema/types';
import { useSelectedMainEvent } from '../hooks/useMainEvents';
import { groupMainEvents, isLocalEvent } from '../utils/mainEventUtils';
import { useLocalEventFilter, useUserPosition } from '../hooks/useLocalEventFilter';
import {
  applyLocalEventFilter,
  describeLocalEventFilter,
  isLocalEventFilterActive,
} from '../utils/localEventFilter';
import { DIVIDER_COLOR, PAGE_PADDING, typeScale } from '../styles/typeScale';
import MainEventListItem from './MainEventListItem';

const GROUPS: Array<{ key: 'ongoing' | 'rootEvents' | 'local'; title: string }> = [
  { key: 'ongoing', title: 'Pågår nu' },
  { key: 'rootEvents', title: 'Kommande riksträffar' },
  { key: 'local', title: 'Lokalt' },
];

interface MainEventsStartPageProps {
  mainEvents: Event[];
  loading: boolean;
}

/** Information tab with no main event selected. */
const MainEventsStartPage: React.FC<MainEventsStartPageProps> = ({ mainEvents, loading }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const styles = useMemo(() => createStyles(colorScheme), [colorScheme]);
  const { selectMainEvent } = useSelectedMainEvent();

  const [localFilter] = useLocalEventFilter();
  const position = useUserPosition();
  const hasLocalEvents = useMemo(() => mainEvents.some(isLocalEvent), [mainEvents]);
  const localFilterActive = hasLocalEvents && isLocalEventFilterActive(localFilter);

  // The local event filter set under Aktiviteter applies here too; riksträffar are never filtered.
  const visibleEvents = useMemo(() => {
    const kept = new Set(applyLocalEventFilter(mainEvents.filter(isLocalEvent), localFilter, position));
    return mainEvents.filter(e => !isLocalEvent(e) || kept.has(e));
  }, [mainEvents, localFilter, position]);
  const groups = useMemo(() => groupMainEvents(visibleEvents, Date.now()), [visibleEvents]);
  const handlePress = (event: Event) => selectMainEvent(event.id);

  const filterSummary = localFilter.mode === 'distance' && !position
    ? 'Avståndsfiltret väntar på din position'
    : describeLocalEventFilter(localFilter);
  const filterNote = localFilterActive ? (
    <TouchableOpacity
      onPress={() => router.navigate('/(tabs)/(events)')}
      style={styles.filterNote}
      accessibilityRole="button"
      accessibilityLabel={`Lokala träffar filtreras: ${filterSummary}. Ändra under Aktiviteter.`}
    >
      <ThemedText style={styles.filterNoteText}>
        {filterSummary} · <ThemedText style={styles.filterNoteLink}>Ändra</ThemedText>
      </ThemedText>
    </TouchableOpacity>
  ) : null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.h1} accessibilityRole="header">Evenemang</ThemedText>

      {loading && mainEvents.length === 0 && (
        <ThemedText style={styles.loading}>Laddar...</ThemedText>
      )}

      {!loading && mainEvents.length === 0 && (
        <View style={styles.noEvents}>
          <MaterialIcons name="event-note" size={48} color={Colors.coolGray400} style={styles.noEventsIcon} />
          <ThemedText style={styles.noEventsText}>Inga evenemang just nu</ThemedText>
        </View>
      )}

      {GROUPS.map(({ key, title }) => {
        // "Lokalt" stays visible while filtered, so an empty result explains itself.
        const showFiltered = key === 'local' && localFilterActive;
        if (groups[key].length === 0 && !showFiltered) return null;
        return (
          <View key={key} style={styles.group}>
            <ThemedText style={styles.h3} accessibilityRole="header">{title}</ThemedText>
            <View style={styles.divider} />
            {showFiltered && filterNote}
            {groups[key].map(event => (
              <MainEventListItem key={event.id} event={event} onPress={handlePress} />
            ))}
            {showFiltered && groups[key].length === 0 && (
              <ThemedText style={styles.loading}>Inga lokala träffar matchar filtret.</ThemedText>
            )}
          </View>
        );
      })}
    </ThemedView>
  );
};

const createStyles = (colorScheme: string) =>
  StyleSheet.create({
    container: { padding: PAGE_PADDING, flex: 1 },
    h1: { ...typeScale.h1, marginBottom: 8 },
    loading: { textAlign: 'center', color: Colors.coolGray500, marginVertical: 20 },
    group: { marginTop: 16 },
    h3: typeScale.h3,
    divider: { height: 1, backgroundColor: DIVIDER_COLOR, marginBottom: 8, marginHorizontal: -PAGE_PADDING },
    filterNote: { minHeight: 44, justifyContent: 'center' },
    filterNoteText: {
      ...typeScale.meta,
      color: colorScheme === 'dark' ? Colors.coolGray400 : '#4B5563',
    },
    filterNoteLink: {
      ...typeScale.meta,
      color: colorScheme === 'dark' ? Colors.primary300 : '#005DB4',
    },
    noEvents: {
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 50,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : 'rgba(243, 244, 246, 0.6)',
    },
    noEventsIcon: { marginVertical: 12, opacity: 0.6 },
    noEventsText: {
      fontSize: 16,
      color: Colors.coolGray500,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

export default MainEventsStartPage;
