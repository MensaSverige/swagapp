import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * leaves the event: it clears the selection and dismisses auto-select for the
 * session.
 */
const EventHeader: React.FC<EventHeaderProps> = ({ title, onBack }) => {
  const { selectedMainEvent, leaveMainEvent } = useSelectedMainEvent();
  const insets = useSafeAreaInsets();

  if (!selectedMainEvent) return null;

  const handleBack = () => {
    leaveMainEvent();
    onBack?.();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, height: EVENT_HEADER_HEIGHT + insets.top }]}>
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
