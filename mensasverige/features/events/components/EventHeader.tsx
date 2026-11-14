import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelectedMainEvent } from '../hooks/useMainEvents';
import { EVENT_HEADER_BG, EVENT_HEADER_HEIGHT, typeScale } from '../styles/typeScale';

interface EventHeaderProps {
  /** Overrides the selected event's name. */
  title?: string;
  /** Called after the selection is cleared. */
  onBack?: () => void;
}

/**
 * Header shown while a main event is selected (focus mode). Reads the selection
 * from the store and renders nothing when none is selected. The back chevron
 * leaves the event: it clears the selection, dismisses auto-select for the
 * session and goes to the start page (Information tab) with the event list,
 * whichever tab it was pressed on.
 *
 * The tab layout's SafeAreaView already keeps it clear of the status bar;
 * EventHeaderStatusBar paints that strip in the header's blue.
 */
const EventHeader: React.FC<EventHeaderProps> = ({ title, onBack }) => {
  const { selectedMainEvent, leaveMainEvent } = useSelectedMainEvent();

  if (!selectedMainEvent) return null;

  const handleBack = () => {
    leaveMainEvent();
    onBack?.();
    router.navigate('/(tabs)/(home)');
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleBack}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Tillbaka till evenemang"
      >
        <MaterialIcons name="chevron-left" size={32} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail" accessibilityRole="header">
        {title ?? selectedMainEvent.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: EVENT_HEADER_BG,
    height: EVENT_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typeScale.eventHeaderTitle,
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

export default EventHeader;
