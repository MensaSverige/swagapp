import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Event } from '../../../api_schema/types';
import { ThemedText } from '@/components/ThemedText';
import EventListItem from './EventListItem';
import { ExtendedEvent, GroupedEvents } from '../types/eventUtilTypes';
import { displayLocaleTimeStringDate } from '../utils/eventUtils';
import { PAGE_PADDING } from '../styles/typeScale';

interface GroupedEventsListProps {
  groupedEvents: GroupedEvents;
  onEventPress: (event: ExtendedEvent) => void;
  nextEvent?: ExtendedEvent | null;
  nextEventMarkerRef?: React.RefObject<View | null>;
  showCategories?: boolean;
  dateHeaderStyle?: 'default' | 'subtitle' | 'aligned';
  /** The parent pads its content by PAGE_PADDING; stretch rows and dividers to the screen edges. */
  bleed?: boolean;
}

const GroupedEventsList: React.FC<GroupedEventsListProps> = ({
  groupedEvents,
  onEventPress,
  nextEvent,
  nextEventMarkerRef,
  showCategories = true,
  dateHeaderStyle = 'default',
  bleed = false,
}) => {
  return (
    <>
      {Object.keys(groupedEvents).map((date) => (
        <View key={date}>
          {/* Next event marker for scroll positioning */}
          {nextEvent && nextEvent.id === groupedEvents[date][0].id && nextEventMarkerRef && (
            <View ref={nextEventMarkerRef} />
          )}
          

          <ThemedText 
            style={dateHeaderStyle === 'aligned' ? styles.dateHeaderAligned : undefined} 
            type="defaultSemiBold"
          >
            {displayLocaleTimeStringDate(date)}
          </ThemedText>

          
          <View style={bleed ? styles.bleed : undefined}>
            <View style={styles.divider} />

            {/* Events for this date */}
            {groupedEvents[date].map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onPress={onEventPress}
                opacity={
                  event.start && nextEvent && nextEvent.start && event.start < nextEvent?.start 
                    ? 0.5 
                    : 1.0
                }
                nextEventMarkerRef={nextEventMarkerRef}
                isNextEvent={!!(nextEvent && nextEvent.id === event.id)}
                isFirstEventOfDay={event.id === groupedEvents[date][0].id}
                showCategories={showCategories}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  dateHeaderAligned: {
    paddingHorizontal: PAGE_PADDING,
    marginBottom: 8,
  },
  bleed: {
    marginHorizontal: -PAGE_PADDING,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
});

export default GroupedEventsList;