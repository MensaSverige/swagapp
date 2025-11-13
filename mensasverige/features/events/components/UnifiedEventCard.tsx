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


const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};




const AttendingComponent: React.FC<{
  event: Event;
  userId: number;
}> = ({ event, userId }) => {
  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);
  const { attendEventById, unattendEventById } = useEvents();

  const handlePressAttend = async () => {
    if (!event.id) return;
    
    setChangingAttendance(true);
    try {
      await attendEventById(event.id);
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
    if (event.bookable) {
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
  event: Event;
}> = ({ event }) => {
  const [admins, setAdmins] = useState<User[] | null>(null);
  const user = useStore(state => state.user);

  // Helper function to get current attendee count
  const getCurrentAttendeeCount = useCallback(() => {
    // Prioritize bookedCount if available, otherwise use attendees array length
    if (typeof event.extras?.bookedCount === 'number') {
      return event.extras.bookedCount;
    } else if (event.attendees) {
      return event.attendees.length;
    }
    return 0;
  }, [event.attendees, event.extras]);

  // Calculate places left for bookable events
  const placesLeft = useMemo(() => {
    if (!event.maxAttendees) return null;
    
    let currentAttendees = 0;
    
    // Prioritize bookedCount if available, otherwise use attendees array length
    if (typeof event.extras?.bookedCount === 'number') {
      currentAttendees = event.extras.bookedCount;
    } else if (event.attendees) {
      currentAttendees = event.attendees.length;
    } else {
      return null; // Can't determine attendee count
    }
    
    return event.maxAttendees - currentAttendees;
  }, [event.maxAttendees, event.attendees, event.extras]);

  return (
    <View>
        <EventDateTimeDisplay
          start={event.start ?? ""}
          end={event.end}
          isEditable={false}
        />
          {event.imageUrl && (
            <Image
              style={eventCardStyles.eventImage}
              source={{ uri: event.imageUrl }}
              resizeMode="contain"
            />
          )}
          <View style={eventCardStyles.headingContainer}>
            <Text style={eventCardStyles.heading}>
              {event.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {event.attending && <AttendingBadge />}
              
              {!event.bookable && (!!event.maxAttendees || event.maxAttendees === 0) && (
                <FullyBookedBadge />
              )}
              
              {placesLeft !== null && placesLeft > 0 && event.maxAttendees && (
                <PlacesLeftBadge placesLeft={placesLeft} maxAttendees={event.maxAttendees} />
              )}
            </View>
          </View>

          {(event.address || event.locationDescription) && (
            <View style={eventCardStyles.locationSection}>
              {event.address && (
                <AddressLinkAndIcon
                  displayName={
                    event.address.includes(', Sweden')
                    ? event.address.replace(', Sweden', '')
                    : event.address
                  }
                  address={event.address}
                />
              )}
              {event.locationDescription && (
                <Text style={eventCardStyles.locationText}>{event.locationDescription}</Text>
              )}
            </View>
          )}

          {/* Tags */}
          { ((event.tags && event.tags.length > 0) || (event.official !== undefined)) && (
            <View style={eventCardStyles.tagsSection}>
              <View style={eventCardStyles.tagsContainer}>
                {/* Event type badge */}
                        <CategoryBadge
                            eventType={event.official ? 'official' : 'non-official'}
                            showLabel={true}
                            size="medium"
                        />
                        {event.tags?.map((category, index) => (
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
          {(event.cancelled || (event.price !== undefined && event.price > 0) || event.parentEvent) && (
            <View style={eventCardStyles.eventStatusSection}>
              {event.cancelled && (
                <View style={eventCardStyles.statusRow}>
                  <Text style={eventCardStyles.statusLabel}>Status:</Text>
                  <Text style={[eventCardStyles.statusText, eventCardStyles.cancelledText]}>Inställt</Text>
                </View>
              )}
              {event.price !== undefined && event.price > 0 && (
                <View style={eventCardStyles.statusRow}>
                  <Text style={eventCardStyles.statusLabel}>Pris:</Text>
                  <Text style={eventCardStyles.statusText}>{event.price} SEK</Text>
                </View>
              )}
              {event.parentEvent && (
                <View style={eventCardStyles.statusRow}>
                  <Text style={eventCardStyles.statusLabel}>Del av:</Text>
                  <Text style={eventCardStyles.statusText}>{event.parentEvent}</Text>
                </View>
              )}
            </View>
          )}

          {/* Hosts */}
          {event.hosts && event.hosts.length > 0 && (
            <View style={eventCardStyles.hostsSection}>
              <Text style={eventCardStyles.subHeading}>Värdar</Text>
              {event.hosts.map((host, index) => (
                <Text key={index} style={eventCardStyles.detailText}>{host.fullName || `Värd ${index + 1}`}</Text>
              ))}
            </View>
          )}

          {/* Attendees (if allowed to show) */}
          {(() => {
            const currentCount = getCurrentAttendeeCount();
            const hasAttendees = currentCount > 0;
            
            if (!hasAttendees || event.showAttendees === 'none') return null;
            
            return (
              <View style={eventCardStyles.attendeesSection}>
                <Text style={eventCardStyles.subHeading}>
                  Deltagare ({currentCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''})
                </Text>
                {event.showAttendees === 'all' && event.attendees && (
                  <View style={eventCardStyles.attendeesList}>
                    {event.attendees.slice(0, 10).map((attendee, index) => (
                      <Text key={index} style={eventCardStyles.attendeeText}>
                        {`Deltagare ${attendee.userId}`}
                      </Text>
                    ))}
                    {event.attendees.length > 10 && (
                      <Text style={eventCardStyles.moreAttendeesText}>
                        ... och {event.attendees.length - 10} till
                      </Text>
                    )}
                  </View>
                )}
                {event.showAttendees === 'all' && !event.attendees && currentCount > 0 && (
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
          {/* {event.queue && event.queue.length > 0 && (
            <View style={styles.queueSection}>
              <Text style={styles.subHeading}>Kö ({event.queue.length})</Text>
              <Text style={styles.detailText}>Du står i kö för detta evenemang</Text>
            </View>
          )} */}

          <View style={eventCardStyles.divider} />
          <Text style={eventCardStyles.descriptionText}>
            {filterHtml(event.description ?? "")}
          </Text>
          <View style={eventCardStyles.linksContainer}>
            {extractLinks(event.description ?? "")?.map((link, index) => (
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
            <AttendingComponent event={event} userId={user.userId} />
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
