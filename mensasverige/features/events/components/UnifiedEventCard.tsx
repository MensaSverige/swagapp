import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { useEventAttendance } from '../hooks/useEventAttendance';
import CategoryBadge from './CategoryBadge';


const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};




const AttendingComponent: React.FC<{
  event: Event;
  userId: number;
}> = ({ event, userId }) => {
  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);
  const { attendEventById, unattendEventById } = useEventAttendance();

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
      <View style={styles.attendingButtonContainer}>
        <ActivityIndicator size="small" color="#0F766E" />
      </View>
    );
  }

  if (event.attending) {
    return (
      <View style={styles.attendingButtonContainer}>
        <TouchableOpacity onPress={handlePressUnattend} style={styles.unattendButton}>
          <Text style={styles.buttonText}>Ta bort anmälan</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    if (event.bookable) {
      return (
        <View style={styles.attendingButtonContainer}>
          <TouchableOpacity onPress={handlePressAttend} style={styles.attendingButton}>
            <Text style={styles.buttonText}>Anmäl mig!</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <EventDateTimeDisplay
          start={event.start ?? ""}
          end={event.end}
          isEditable={false}
        />
        <View style={styles.vstack}>
          {event.imageUrl && (
            <Image
              style={styles.eventImage}
              source={{ uri: event.imageUrl }}
              resizeMode="contain"
            />
          )}
          <View style={styles.headingContainer}>
            <Text style={styles.heading}>
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
            <View style={styles.locationSection}>
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
                <Text style={styles.locationText}>{event.locationDescription}</Text>
              )}
            </View>
          )}

          {/* Tags */}
          { ((event.tags && event.tags.length > 0) || (event.official !== undefined)) && (
            <View style={styles.tagsSection}>
              <View style={styles.tagsContainer}>
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
            <View style={styles.eventStatusSection}>
              {event.cancelled && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Text style={[styles.statusText, styles.cancelledText]}>Inställt</Text>
                </View>
              )}
              {event.price !== undefined && event.price > 0 && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Pris:</Text>
                  <Text style={styles.statusText}>{event.price} SEK</Text>
                </View>
              )}
              {event.parentEvent && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Del av:</Text>
                  <Text style={styles.statusText}>{event.parentEvent}</Text>
                </View>
              )}
            </View>
          )}

          {/* Hosts */}
          {event.hosts && event.hosts.length > 0 && (
            <View style={styles.hostsSection}>
              <Text style={styles.subHeading}>Värdar</Text>
              {event.hosts.map((host, index) => (
                <Text key={index} style={styles.detailText}>{host.fullName || `Värd ${index + 1}`}</Text>
              ))}
            </View>
          )}

          {/* Attendees (if allowed to show) */}
          {(() => {
            const currentCount = getCurrentAttendeeCount();
            const hasAttendees = currentCount > 0;
            
            if (!hasAttendees || event.showAttendees === 'none') return null;
            
            return (
              <View style={styles.attendeesSection}>
                <Text style={styles.subHeading}>
                  Deltagare ({currentCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''})
                </Text>
                {event.showAttendees === 'all' && event.attendees && (
                  <View style={styles.attendeesList}>
                    {event.attendees.slice(0, 10).map((attendee, index) => (
                      <Text key={index} style={styles.attendeeText}>
                        {`Deltagare ${attendee.userId}`}
                      </Text>
                    ))}
                    {event.attendees.length > 10 && (
                      <Text style={styles.moreAttendeesText}>
                        ... och {event.attendees.length - 10} till
                      </Text>
                    )}
                  </View>
                )}
                {event.showAttendees === 'all' && !event.attendees && currentCount > 0 && (
                  <View style={styles.attendeesList}>
                    <Text style={styles.attendeeText}>
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

          <View style={styles.divider} />
          <Text style={styles.descriptionText}>
            {filterHtml(event.description ?? "")}
          </Text>
          <View style={styles.linksContainer}>
            {extractLinks(event.description ?? "")?.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link.url)}
              >
                <Text style={styles.linkText}>{link.name}</Text>
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
            <View key={admin.userId} style={styles.adminRow}>
              <UserAvatar
                avatarSize="sm"
                firstName={admin.firstName}
                lastName={admin.lastName}
                avatar_url={admin.avatar_url ?? ""}
                onlineStatus="offline"
              />
              <View style={styles.adminInfo}>
                <Text style={styles.subHeading}>
                  {admin.firstName} {admin.lastName}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 18,
    marginBottom: 0,
    color: '#374151',
  },
  timeText: {
    fontSize: 14,
    color: '#0F766E',
    marginBottom: 12,
    paddingTop: 2,
  },
  eventImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
    color: '#111827',
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  linksContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
  },
  linkButton: {
    marginRight: 12,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminInfo: {
    flex: 1,
    marginLeft: 8,
  },
  vstack: {
    flex: 1,
  },
  hstack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationSection: {
    marginBottom: 12,
  },
  attendingButtonContainer: {
    marginTop: 16,
  },
  attendingButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unattendButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventStatusSection: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 60,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
  },
  cancelledText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  bookingSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    minWidth: 100,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  tagsSection: {
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  hostsSection: {
    marginBottom: 12,
  },
  attendeesSection: {
    marginBottom: 12,
  },
  attendeesList: {
    marginTop: 4,
  },
  attendeeText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  moreAttendeesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  queueSection: {
    marginBottom: 12,
  },
  adminSection: {
    marginBottom: 12,
  },
});


export default UnifiedEventCard;
