import React, { useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Event } from '../../../api_schema/types';
import { useSelectedMainEvent } from '../hooks/useMainEvents';
import { groupMainEvents } from '../utils/mainEventUtils';
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

  const groups = useMemo(() => groupMainEvents(mainEvents, Date.now()), [mainEvents]);
  const handlePress = (event: Event) => selectMainEvent(event.id);

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

      {GROUPS.map(({ key, title }) =>
        groups[key].length > 0 ? (
          <View key={key} style={styles.group}>
            <ThemedText style={styles.h3} accessibilityRole="header">{title}</ThemedText>
            <View style={styles.divider} />
            {groups[key].map(event => (
              <MainEventListItem key={event.id} event={event} onPress={handlePress} />
            ))}
          </View>
        ) : null,
      )}
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
    divider: { height: 1, backgroundColor: DIVIDER_COLOR, marginBottom: 8 },
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
