import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Event, User } from '../../../api_schema/types';
import UserAvatar from '../../map/components/UserAvatar';
import { filterHtml } from '../../common/functions/filterHtml';
import { extractLinks } from '../../common/functions/extractLinks';
import { AddressLinkAndIcon } from '../../map/components/AddressLinkAndIcon';

import AttendingBadge from './AttendingBadge';
import FullyBookedBadge from './FullyBookedBadge';
import PlacesLeftBadge from './PlacesLeftBadge';
import EventDateTimeDisplay from './EventDateTimeDisplay';
import useStore from '../../common/store/store';
import { useEvents } from '../hooks/useEvents';
import CategoryBadge from './CategoryBadge';
import { eventCardStyles, dateTimeStyles } from '../styles/eventCardStyles';
import { ExtendedEvent } from '../types/eventUtilTypes';


const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};




const AttendingComponent: React.FC<{
  event: ExtendedEvent;
  userId: number;
  onAttendanceChange?: () => void;
}> = ({ event, userId, onAttendanceChange }) => {
  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);
  const { attendEventById, unattendEventById } = useEvents();

  const handlePressAttend = async () => {
    if (!event.id) return;
    
    setChangingAttendance(true);
    try {
      await attendEventById(event.id);
      onAttendanceChange?.(); // Notify parent of attendance change
    } catch (error) {
      console.error('Could not attend event', error);
      Alert.alert('Error', 'Could not attend event. Please try again.');
    } finally {
      setChangingAttendance(false);
    }
  };

  const handlePressUnattend = async () => {
    if (!event.id) return;
    
    setChangingAttendance(true);
    try {
      await unattendEventById(event.id);
      onAttendanceChange?.(); // Notify parent of attendance change
    } catch (error) {
      console.error('Could not unattend event', error);
      Alert.alert('Error', 'Could not unattend event. Please try again.');
    } finally {
      setChangingAttendance(false);
    }
  };

  if (changingAttendance) {
    return (
      <View style={eventCardStyles.attendingButtonContainer}>
        <ActivityIndicator size="small" color="#0F766E" />
      </View>
    );
  }

  if (event.attending) {
    return (
      <View style={eventCardStyles.attendingButtonContainer}>
        <TouchableOpacity onPress={handlePressUnattend} style={eventCardStyles.unattendButton}>
          <Text style={eventCardStyles.buttonText}>Ta bort anmälan</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    if (!event.attendingOrHost) { // TODO: show delete event if user is host
      return (
        <View style={eventCardStyles.attendingButtonContainer}>
          <TouchableOpacity onPress={handlePressAttend} style={eventCardStyles.attendingButton}>
            <Text style={eventCardStyles.buttonText}>Anmäl mig!</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }
};

const UnifiedEventCard: React.FC<{
  event: ExtendedEvent;
}> = ({ event }) => {
  const [admins, setAdmins] = useState<User[] | null>(null);
  const user = useStore(state => state.user);
  const { allEvents } = useEvents();

  // Get the current event state from the store to ensure we have the latest data
  const currentEvent = useMemo(() => {
    const storeEvent = allEvents.find(e => e.id === event.id);
    return storeEvent || event; // Fallback to prop if not found in store
  }, [allEvents, event]);

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
          <View style={eventCardStyles.headingContainer}>
            <Text style={eventCardStyles.heading}>
              {currentEvent.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {currentEvent.attending && <AttendingBadge />}
              
              {!currentEvent.bookable && (!!currentEvent.maxAttendees || currentEvent.maxAttendees === 0) && (
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
                <Text style={eventCardStyles.locationText}>{currentEvent.locationDescription}</Text>
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
                  <Text style={eventCardStyles.statusLabel}>Status:</Text>
                  <Text style={[eventCardStyles.statusText, eventCardStyles.cancelledText]}>Inställt</Text>
                </View>
              )}
              {currentEvent.price !== undefined && currentEvent.price > 0 && (
                <View style={eventCardStyles.statusRow}>
                  <Text style={eventCardStyles.statusLabel}>Pris:</Text>
                  <Text style={eventCardStyles.statusText}>{currentEvent.price} SEK</Text>
                </View>
              )}
              {currentEvent.parentEvent && (
                <View style={eventCardStyles.statusRow}>
                  <Text style={eventCardStyles.statusLabel}>Del av:</Text>
                  <Text style={eventCardStyles.statusText}>{currentEvent.parentEvent}</Text>
                </View>
              )}
            </View>
          )}

          {/* Hosts */}
          {currentEvent.hosts && currentEvent.hosts.length > 0 && (
            <View style={eventCardStyles.hostsSection}>
              <Text style={eventCardStyles.subHeading}>Värdar</Text>
              {currentEvent.hosts.map((host, index) => (
                <Text key={index} style={eventCardStyles.detailText}>{host.fullName || `Värd ${index + 1}`}</Text>
              ))}
            </View>
          )}

          {/* Attendees (if allowed to show) */}
          {(() => {
            const currentCount = getCurrentAttendeeCount();
            const hasAttendees = currentCount > 0;
            
            if (!hasAttendees || currentEvent.showAttendees === 'none') return null;
            
            return (
              <View style={eventCardStyles.attendeesSection}>
                <Text style={eventCardStyles.subHeading}>
                  Deltagare ({currentCount}{currentEvent.maxAttendees ? `/${currentEvent.maxAttendees}` : ''})
                </Text>
                {currentEvent.showAttendees === 'all' && currentEvent.attendees && (
                  <View style={eventCardStyles.attendeesList}>
                    {currentEvent.attendees.slice(0, 10).map((attendee, index) => (
                      <Text key={index} style={eventCardStyles.attendeeText}>
                        {`Deltagare ${attendee.userId}`}
                      </Text>
                    ))}
                    {currentEvent.attendees.length > 10 && (
                      <Text style={eventCardStyles.moreAttendeesText}>
                        ... och {currentEvent.attendees.length - 10} till
                      </Text>
                    )}
                  </View>
                )}
                {currentEvent.showAttendees === 'all' && !currentEvent.attendees && currentCount > 0 && (
                  <View style={eventCardStyles.attendeesList}>
                    <Text style={eventCardStyles.attendeeText}>
                      {currentCount} anmälda deltagare
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Queue */}
          {/* {currentEvent.queue && currentEvent.queue.length > 0 && (
            <View style={styles.queueSection}>
              <Text style={styles.subHeading}>Kö ({currentEvent.queue.length})</Text>
              <Text style={styles.detailText}>Du står i kö för detta evenemang</Text>
            </View>
          )} */}

          <View style={eventCardStyles.divider} />
          <Text style={eventCardStyles.descriptionText}>
            {filterHtml(currentEvent.description ?? "")}
          </Text>
          <View style={eventCardStyles.linksContainer}>
            {extractLinks(currentEvent.description ?? "")?.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={eventCardStyles.linkButton}
                onPress={() => handleLinkPress(link.url)}
              >
                <Text style={eventCardStyles.linkText}>{link.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {user && (
            <AttendingComponent 
              event={currentEvent} 
              userId={user.userId} 
              onAttendanceChange={handleAttendanceChange}
            />
          )}

          {/* Admin Users */}
          {/* {event.admin && event.admin.length > 0 && (
            <View style={styles.adminSection}>
              <Text style={styles.subHeading}>Administratörer</Text>
              {event.admin.map((adminId, index) => (
                <Text key={index} style={styles.detailText}>{adminId}</Text>
              ))}
            </View>
          )} */}

          {admins && admins.map((admin) => (
            <View key={admin.userId} style={eventCardStyles.adminRow}>
              <UserAvatar
                avatarSize="sm"
                firstName={admin.firstName}
                lastName={admin.lastName}
                avatar_url={admin.avatar_url ?? ""}
                onlineStatus="offline"
              />
              <View style={eventCardStyles.adminInfo}>
                <Text style={eventCardStyles.subHeading}>
                  {admin.firstName} {admin.lastName}
                </Text>
              </View>
            </View>
          ))}

    </View>
  );
};

// Styles are now imported from ../styles/eventCardStyles


export default UnifiedEventCard;
