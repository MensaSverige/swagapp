import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useEvents } from '../hooks/useEvents';
import { useEventAttendance } from '../hooks/useEventAttendance';
import { ExtendedEvent } from '../types/eventUtilTypes';
import EventInfoRows from './eventPage/EventInfoRows';
import EventRegisterButton from './eventPage/EventRegisterButton';
import EventDescription from './eventPage/EventDescription';
import EventPeople from './eventPage/EventPeople';

/**
 * The event page for an activity, and for a local event opened from
 * Aktiviteter: the same rows, description, host and participants as a main
 * event's page. The name is in the screen's header.
 */
const UnifiedEventCard: React.FC<{ event: ExtendedEvent }> = ({ event }) => {
  const { allEvents } = useEvents();

  // The latest copy from the store, so a registration shows at once.
  const currentEvent = useMemo(
    () => allEvents.find(e => e.id === event.id) ?? event,
    [allEvents, event],
  );
  const { status, busy, register, unregister } = useEventAttendance(currentEvent);

  return (
    <View>
      {!!currentEvent.imageUrl && (
        <Image style={styles.image} source={{ uri: currentEvent.imageUrl }} resizeMode="contain" />
      )}
      <EventInfoRows event={currentEvent} status={status} busy={busy} onUnregister={unregister} />
      {status.kind === 'open' && <EventRegisterButton onPress={register} busy={busy} />}
      <EventDescription description={currentEvent.description} />
      <EventPeople event={currentEvent} />
    </View>
  );
};

const styles = StyleSheet.create({
  // As before the event page was unified.
  image: {
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default UnifiedEventCard;
