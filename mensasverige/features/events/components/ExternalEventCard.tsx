import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking
} from 'react-native';
import { ExternalEventDetails, User } from '../../../api_schema/types';
import UserAvatar from '../../map/components/UserAvatar';
import { displayLocaleTimeStringDate } from '../screens/MyExternalEvents';
import { filterHtml } from '../../common/functions/filterHtml';
import { extractLinks } from '../../common/functions/extractLinks';
import { AddressLinkAndIcon } from '../../map/components/AddressLinkAndIcon';
import { parseMapUrl } from '../../map/functions/parseMapUrl';

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
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
    color: '#111827',
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
  speakerContainer: {
    marginBottom: 16,
  },
  speakerRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  speakerInfo: {
    fontSize: 14,
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
});

const handleLinkPress = (url: string) => {
  Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
};


function formatSpeakerInfo(description: string): string {
  const emMatches = description.match(/<em>(.*?)<\/em>/g);
  if (!emMatches) return '';

  const speakerInfo = emMatches[emMatches.length - 1].replace(/<\/?em>/g, '');
  const cleanedSpeakerInfo = speakerInfo.replace(/^[A-ZÅÄÖa-zåäö]+( [A-ZÅÄÖa-zåäö]+)? är /, '');

  return cleanedSpeakerInfo.charAt(0).toUpperCase() + cleanedSpeakerInfo.slice(1);
}

function removeLastEmTag(description: string): string {
  const emMatches = description.match(/<em>(.*?)<\/em>/g);
  if (!emMatches) return description;

  const lastEmTag = emMatches[emMatches.length - 1];
  const lastIndex = description.lastIndexOf(lastEmTag);

  return description.slice(0, lastIndex) + description.slice(lastIndex + lastEmTag.length);
}

const ExternalEventCard: React.FC<{
  eventDetails: ExternalEventDetails;
}> = ({ eventDetails }) => {
  const [event, setEvent] = useState<ExternalEventDetails>(eventDetails);
  const [admins, setAdmins] = useState<User[] | null>(null);
  const capitalizedSpeakerInfo = useMemo(() => formatSpeakerInfo(eventDetails.description), [eventDetails.description]);

  //TODO: jag är trött 
  // useEffect(() => {
  //   if (eventDetails.admins && eventDetails.admins.length > 0) {

  //     //setSpeaker({ id: eventDetails.speakerId, firstName: '', lastName: '', avatarUrl: '' });
  //   }
  // }, [eventDetails.admins]);


  const renderAddressLinkAndIcon = useCallback(() => {
    if (!event.mapUrl) return null;
    const searchParameters = parseMapUrl(event.mapUrl);
    if (searchParameters) {
      return (
        <View style={[styles.hstack, { justifyContent: 'flex-start', marginBottom: 0 }]}>
          <AddressLinkAndIcon
            displayName={event.location || undefined}
            latitude={searchParameters.latitude}
            longitude={searchParameters.longitude}
            landmark={searchParameters.landmark || event.location}
            searchParameters={searchParameters.searchParameters}
          />
        </View>
      );
    }
  }, [event.mapUrl, event.location]);

  useEffect(() => {
    if (capitalizedSpeakerInfo && event.description.includes('<em>')) {
      const updatedDescription = removeLastEmTag(event.description);
      setEvent(prevEvent => ({ ...prevEvent, description: updatedDescription }));
    }
  }, [capitalizedSpeakerInfo, event.description]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.dateText}>
          {displayLocaleTimeStringDate(event.eventDate ?? "")}
        </Text>
        <Text style={styles.timeText}>
          {event.startTime} - {event.endTime}
        </Text>
        <View style={styles.vstack}>
          {event.imageUrl300 && (
            <Image
              style={styles.eventImage}
              source={{ uri: event.imageUrl300 }}
            />
          )}
          <Text style={styles.heading}>
            {event.titel}
          </Text>
          {event.mapUrl ? 
            renderAddressLinkAndIcon()
            : 
            <Text style={styles.locationText}> 
              {event.location} 
            </Text>
          }

          {event.speaker && (
            <View style={styles.speakerContainer}>
              <View style={styles.speakerRow}>
                <Text style={styles.subHeading}>
                  {event.speaker}
                </Text>
                {capitalizedSpeakerInfo && (
                  <Text style={styles.speakerInfo}>
                    {filterHtml(capitalizedSpeakerInfo)}
                  </Text>
                )}
              </View>
            </View>
          )}
          <View style={styles.divider} />
          <Text style={styles.descriptionText}>
            {filterHtml(event.description)}
          </Text>
          <View style={styles.linksContainer}>
            {extractLinks(event.description)?.map((link, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.linkButton}
                onPress={() => handleLinkPress(link.url)}
              >
                <Text style={styles.linkText}>{link.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    </ScrollView>
  );
};

export default ExternalEventCard;
