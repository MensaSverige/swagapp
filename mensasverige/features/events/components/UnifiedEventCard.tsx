import React, { useCallback, useMemo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Linking,
  useColorScheme,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { filterHtml } from '@/features/common/functions/filterHtml';
import { extractLinks } from '@/features/common/functions/extractLinks';
import { AddressLinkAndIcon } from '@/features/map/components/AddressLinkAndIcon';

import AttendingBadge from './badges/AttendingBadge';
import FullyBookedBadge from './badges/FullyBookedBadge';
import PlacesLeftBadge from './PlacesLeftBadge';
import AttendeeCountBadge from './badges/AttendeeCountBadge';
import EventDateTimeDisplay from './EventDateTimeDisplay';
import AttendingComponent from './AttendingComponent';
import useStore from '@/features/common/store/store';
import { useEvents } from '../hooks/useEvents';
import { useEventUsers } from '../hooks/useEventUsers';
import CategoryBadge from './badges/CategoryBadge';
import { createEventCardStyles } from '../styles/eventCardStyles';
import { ExtendedEvent } from '../types/eventUtilTypes';
import UserList from './UserList';


const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};

const UnifiedEventCard: React.FC<{
  event: ExtendedEvent;
}> = ({ event }) => {
  const colorScheme = useColorScheme();
  const eventCardStyles = createEventCardStyles(colorScheme ?? 'light');
  const user = useStore(state => state.user);
  const { allEvents } = useEvents();

  // Get the current event state from the store to ensure we have the latest data
  const currentEvent = useMemo(() => {
    const storeEvent = allEvents.find(e => e.id === event.id);
    return storeEvent || event; // Fallback to prop if not found in store
  }, [allEvents, event]);

  const { adminUsers, attendeeUsers } = useEventUsers(currentEvent);
  const showBookedCount = currentEvent.showAttendees !== 'none';

  // Helper function to get current attendee count
  const getCurrentAttendeeCount = useCallback(() => {
    // Prioritize bookedCount if available, otherwise use attendees array length
    if (typeof currentEvent.extras?.bookedCount === 'number') {
      return currentEvent.extras.bookedCount;
    } else if (currentEvent.attendees) {
      return currentEvent.attendees.length;
    }
    return 0;
  }, [currentEvent.attendees, currentEvent.extras]);

  // Calculate places left for bookable events
  const placesLeft = useMemo(() => {
    if (!currentEvent.maxAttendees) return null;

    let currentAttendees = 0;

    // Prioritize bookedCount if available, otherwise use attendees array length
    if (typeof currentEvent.extras?.bookedCount === 'number') {
      currentAttendees = currentEvent.extras.bookedCount;
    } else if (currentEvent.attendees) {
      currentAttendees = currentEvent.attendees.length;
    } else {
      return null; // Can't determine attendee count
    }

    return currentEvent.maxAttendees - currentAttendees;
  }, [currentEvent.maxAttendees, currentEvent.attendees, currentEvent.extras]);

  return (
    <View>
      <EventDateTimeDisplay
        start={currentEvent.start ?? ""}
        end={currentEvent.end}
        isEditable={false}
      />
      {currentEvent.imageUrl && (
        <Image
          style={eventCardStyles.eventImage}
          source={{ uri: currentEvent.imageUrl }}
          resizeMode="contain"
        />
      )}
      <View style={eventCardStyles.titleContainer}>
        <ThemedText type="subtitle">
          {currentEvent.name}
        </ThemedText>
        <View style={eventCardStyles.badgeContainer}>
          {currentEvent.attending && <AttendingBadge />}

          {!currentEvent.bookable && showBookedCount && placesLeft !== null && placesLeft <= 0 && (
            <FullyBookedBadge />
          )}

          {currentEvent.bookable && showBookedCount && placesLeft !== null && placesLeft > 0 && currentEvent.maxAttendees && (
            <PlacesLeftBadge placesLeft={placesLeft} maxAttendees={currentEvent.maxAttendees} />
          )}

          {showBookedCount && getCurrentAttendeeCount() > 0 && (
            <AttendeeCountBadge attendeeCount={getCurrentAttendeeCount()} />
          )}
        </View>
      </View>

      {(currentEvent.address || currentEvent.locationDescription) && (
        <View style={eventCardStyles.locationSection}>
          {currentEvent.address && (
            <AddressLinkAndIcon
              displayName={
                currentEvent.address.includes(', Sweden')
                  ? currentEvent.address.replace(', Sweden', '')
                  : currentEvent.address
              }
              address={currentEvent.address}
            />
          )}
          {currentEvent.locationDescription && (
            <ThemedText lightColor="#6B7280" darkColor="#9CA3AF">{currentEvent.locationDescription}</ThemedText>
          )}
        </View>
      )}

      {((currentEvent.tags && currentEvent.tags.length > 0) || (currentEvent.official !== undefined)) && (
        <View style={eventCardStyles.tagsSection}>
          <View style={eventCardStyles.tagsContainer}>
            {/* Event type badge */}
            <CategoryBadge
              eventType={currentEvent.official ? 'official' : 'non-official'}
              showLabel={true}
              size="medium"
            />
            {currentEvent.tags?.map((category, index) => (
              <CategoryBadge
                key={index}
                categoryCode={category.code || ''}
                showLabel={true}
                size="medium"
              />
            ))}
          </View>
        </View>
      )}
      {/* Event Status and Type */}
      {(currentEvent.cancelled || (currentEvent.price !== undefined && currentEvent.price > 0) || currentEvent.parentEvent) && (
        <View style={eventCardStyles.eventStatusSection}>
          {currentEvent.cancelled && (
            <View style={eventCardStyles.statusRow}>
              <ThemedText type="defaultSemiBold" style={eventCardStyles.statusLabelMinWidth}>Status:</ThemedText>
              <ThemedText lightColor="#DC2626" darkColor="#F87171" type="defaultSemiBold">Inställt</ThemedText>
            </View>
          )}
          {currentEvent.price !== undefined && currentEvent.price > 0 && (
            <View style={eventCardStyles.statusRow}>
              <ThemedText type="defaultSemiBold" style={eventCardStyles.statusLabelMinWidth}>Pris:</ThemedText>
              <ThemedText>{currentEvent.price} SEK</ThemedText>
            </View>
          )}
          {currentEvent.parentEvent && (
            <View style={eventCardStyles.statusRow}>
              <ThemedText type="defaultSemiBold" style={eventCardStyles.statusLabelMinWidth}>Del av:</ThemedText>
              <ThemedText>{currentEvent.parentEvent}</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Admin Users */}
      {currentEvent.admin && currentEvent.admin.length > 0 && (
        <UserList
          users={adminUsers}
          title={currentEvent.admin.length === 1 ? 'Värd' : 'Värdar'}
          fallbackData={currentEvent.hosts}
        />
      )}

      <View style={eventCardStyles.divider} />
      <ThemedText>
        {filterHtml(currentEvent.description ?? "")}
      </ThemedText>
      <View style={eventCardStyles.linksContainer}>
        {extractLinks(currentEvent.description ?? "")?.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={eventCardStyles.linkButton}
            onPress={() => handleLinkPress(link.url)}
          >
            <ThemedText type="link">{link.name}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>


      {/* Attendees */}
        <UserList
          users={attendeeUsers}
          title="Deltagare"
          expandable
        />

      {user && (
        <AttendingComponent
          event={currentEvent}
        />
      )}

    </View>
  );
};

export default UnifiedEventCard;
