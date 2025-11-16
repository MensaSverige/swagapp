import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking
} from 'react-native';
import { Event, User } from '../../../api_schema/types';
import { ThemedText } from '../../../components/ThemedText';
import UserAvatar from '../../map/components/UserAvatar';
import { filterHtml } from '../../common/functions/filterHtml';
import { extractLinks } from '../../common/functions/extractLinks';
import { AddressLinkAndIcon } from '../../map/components/AddressLinkAndIcon';

import AttendingBadge from './AttendingBadge';
import FullyBookedBadge from './FullyBookedBadge';
import PlacesLeftBadge from './PlacesLeftBadge';
import EventDateTimeDisplay from './EventDateTimeDisplay';
import AttendingComponent from './AttendingComponent';
import useStore from '../../common/store/store';
import { useEvents } from '../hooks/useEvents';
import CategoryBadge from './CategoryBadge';
import { eventCardStyles, dateTimeStyles } from '../styles/eventCardStyles';
import { ExtendedEvent } from '../types/eventUtilTypes';
import { getUsersByIds } from '../../account/services/userService';


const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};

const UnifiedEventCard: React.FC<{
  event: ExtendedEvent;
}> = ({ event }) => {
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const user = useStore(state => state.user);
  const { allEvents } = useEvents();

  // Get the current event state from the store to ensure we have the latest data
  const currentEvent = useMemo(() => {
    const storeEvent = allEvents.find(e => e.id === event.id);
    return storeEvent || event; // Fallback to prop if not found in store
  }, [allEvents, event]);

  // Fetch admin users when admin IDs change
  // useEffect(() => {
  //   const fetchAdminUsers = async () => {
  //     if (currentEvent.admin && currentEvent.admin.length > 0) {
  //       try {
  //         // Convert number IDs to strings for the getUsersByIds function
  //         const adminIdStrings = currentEvent.admin.map(id => id.toString());
  //         const adminUsers = await getUsersByIds(adminIdStrings);
  //         // Handle the case where getUsersByIds returns undefined in catch block
  //         setAdminUsers(adminUsers || []);
  //       } catch (error) {
  //         console.error('Error fetching admin users:', error);
  //         setAdminUsers([]);
  //       }
  //     } else {
  //       setAdminUsers([]);
  //     }
  //   };

  //   fetchAdminUsers();
  // }, [currentEvent.admin]);

  // Force re-render when attendance changes
  const [refreshKey, setRefreshKey] = useState(0);
  const handleAttendanceChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

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
          <View style={{ marginBottom: 4 }}>
            <ThemedText type="subtitle">
              {currentEvent.name}
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8}}>
              {currentEvent.attending && <AttendingBadge />}

              {!currentEvent.bookable && placesLeft !== null && placesLeft <= 0 && (
                <FullyBookedBadge />
              )}

              {placesLeft !== null && placesLeft > 0 && currentEvent.maxAttendees && (
                <PlacesLeftBadge placesLeft={placesLeft} maxAttendees={currentEvent.maxAttendees} />
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

          {/* Tags */}
          { ((currentEvent.tags && currentEvent.tags.length > 0) || (currentEvent.official !== undefined)) && (
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
                  <ThemedText type="defaultSemiBold" style={{ minWidth: 60 }}>Status:</ThemedText>
                  <ThemedText lightColor="#DC2626" darkColor="#F87171" type="defaultSemiBold">Inställt</ThemedText>
                </View>
              )}
              {currentEvent.price !== undefined && currentEvent.price > 0 && (
                <View style={eventCardStyles.statusRow}>
                  <ThemedText type="defaultSemiBold" style={{ minWidth: 60 }}>Pris:</ThemedText>
                  <ThemedText>{currentEvent.price} SEK</ThemedText>
                </View>
              )}
              {currentEvent.parentEvent && (
                <View style={eventCardStyles.statusRow}>
                  <ThemedText type="defaultSemiBold" style={{ minWidth: 60 }}>Del av:</ThemedText>
                  <ThemedText>{currentEvent.parentEvent}</ThemedText>
                </View>
              )}
            </View>
          )}

          {/* Hosts */}
          {currentEvent.hosts && currentEvent.hosts.length > 0 && (
            <View style={eventCardStyles.hostsSection}>
              <ThemedText type="defaultSemiBold">Värdar</ThemedText>
              {currentEvent.hosts.map((host, index) => (
                <ThemedText key={index}>{host.fullName || `Värd ${index + 1}`}</ThemedText>
              ))}
            </View>
          )}


          {/* Queue */}
          {/* {currentEvent.queue && currentEvent.queue.length > 0 && (
            <View style={styles.queueSection}>
              <Text style={styles.subHeading}>Kö ({currentEvent.queue.length})</Text>
              <Text style={styles.detailText}>Du står i kö för detta evenemang</Text>
            </View>
          )} */}

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

          {/* Admin Users */}
          {/* {currentEvent.admin && currentEvent.admin.length > 0 && (
            <View style={eventCardStyles.hostsSection}>
              <Text style={eventCardStyles.subHeading}>Administratörer</Text>
              {adminUsers.length > 0 ? (
                adminUsers.map((admin, index) => (
                  <View key={admin.userId || index} style={eventCardStyles.adminRow}>
                    <UserAvatar
                      avatarSize="sm"
                      firstName={admin.firstName}
                      lastName={admin.lastName}
                      avatar_url={admin.avatar_url ?? ""}
                      onlineStatus="offline"
                    />
                    <View style={eventCardStyles.adminInfo}>
                      <Text style={eventCardStyles.detailText}>
                        {admin.firstName} {admin.lastName}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                // Fallback to showing IDs if user data couldn't be fetched
                currentEvent.admin.map((adminId, index) => (
                  <Text key={index} style={eventCardStyles.detailText}>{adminId}</Text>
                ))
              )}
            </View>
          )}  */}
          {/* Attendees (if allowed to show) */}
          {(() => {
            const currentCount = getCurrentAttendeeCount();
            const hasAttendees = currentCount > 0;

            if (!hasAttendees || currentEvent.showAttendees === 'none') return null;

            return (
              <View style={eventCardStyles.attendeesSection}>
                <ThemedText type="defaultSemiBold">
                  Deltagare 
                </ThemedText>
                {currentEvent.showAttendees === 'all' && currentEvent.attendees && (
                  <View>
                    {currentEvent.attendees.slice(0, 10).map((attendee, index) => (
                      <ThemedText key={index} style={{ marginBottom: 2 }}>
                        {`${attendee.userId}`}
                      </ThemedText>
                    ))}
                    {currentEvent.attendees.length > 10 && (
                      <ThemedText style={{ fontStyle: 'italic', marginTop: 4 }}>
                        ... och {currentEvent.attendees.length - 10} till
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
            );
          })()}

          {user && (
            <AttendingComponent
              event={currentEvent}
              onAttendanceChange={handleAttendanceChange}
            />
          )}

    </View>
  );
};

export default UnifiedEventCard;
