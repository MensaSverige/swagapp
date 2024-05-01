import {
  Box,
  Card,
  Divider,
  Heading,
  HStack,
  Image,
  Link,
  LinkText,
  ScrollView,
  Text,
  VStack,
} from '../../../gluestack-components';
import React, { useEffect, useState } from 'react';
import { ExternalEventDetails, User } from '../../../api_schema/types';
import UserAvatar from '../../map/components/UserAvatar';
import { displayLocaleTimeStringDate } from '../screens/MyExternalEvents';
import { filterHtml } from '../../common/functions/filterHtml';
import { extractLinks } from '../../common/functions/extractLinks';
import LocationLinkButton from '../../common/components/LocationLinkIcon';

const getCoordinatesFromUrl = (mapUrl: string) => {
  const url = new URL(mapUrl);
  const params = new URLSearchParams(url.search);
  const coordinates = params.get('@');
  const latitude = coordinates ? parseFloat(coordinates.split(',')[0]) : 0;
  const longitude = coordinates ? parseFloat(coordinates.split(',')[1]) : 0;
  return { latitude, longitude };
};

const getPlaceFromUrl = (mapUrl: string) => {
  const match = mapUrl.match(/maps\/place\/([^/]+)\//);
  return match ? decodeURIComponent(match[1]) : null;
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
  const capitalizedSpeakerInfo = formatSpeakerInfo(eventDetails.description);

  //TODO: jag är trött 
  // useEffect(() => {
  //   if (eventDetails.admins && eventDetails.admins.length > 0) {

  //     //setSpeaker({ id: eventDetails.speakerId, firstName: '', lastName: '', avatarUrl: '' });
  //   }
  // }, [eventDetails.admins]);

  useEffect(() => {
    if (capitalizedSpeakerInfo) {
      const updatedDescription = removeLastEmTag(event.description);
      setEvent(prevEvent => ({ ...prevEvent, description: updatedDescription }));
    }
  }, [capitalizedSpeakerInfo]);

  return (
<ScrollView width="$full">
    <Card  width="$full">
      <Text
        fontSize="$sm"
        fontStyle="normal"
        fontFamily="$heading"
        fontWeight="$normal"
        lineHeight="$sm"
        mb="$0"
      >
        {displayLocaleTimeStringDate(event.eventDate ?? "")}

      </Text>
      <Text mb="$3" size="sm" color='$teal700' paddingTop={2}>
        {event.startTime} - {event.endTime}
      </Text>
      <VStack mb="$2">
        {event.imageUrl300 && (
          <Image
            mb="$2"
            source={{ uri: event.imageUrl300 }}
            alt="Image"
            width="$full"
            height={150}
          />
        )}
        <Heading size="md" fontFamily="$heading" mb="$4">
          {event.titel}
        </Heading>
        {event.speaker && (
          <Box >
            <VStack flex={1} flexDirection="row" flexWrap='wrap' mb="$4">
              <Heading size="sm" fontFamily="$heading" mb="$1">
                {event.speaker}
              </Heading>
              {capitalizedSpeakerInfo && (
                <Text size="sm" fontFamily="$heading">
                  {filterHtml(capitalizedSpeakerInfo)}
                </Text>
              )}
            </VStack>
          </Box>
          
        )}
        <Divider mb="$4" />
        <Text size="sm" fontFamily="$heading">
          {filterHtml(event.description)}
        </Text>
        <HStack flex={1} flexDirection="row" flexWrap='wrap' paddingTop={10}>
          {extractLinks(event.description)?.map((link, index) => (
            <Link href={link.url} key={index}>
              <LinkText>{link.name}</LinkText>
            </Link>
          ))}
        </HStack>
      </VStack>
      {admins && admins.map((admin) => (
        <Box flexDirection="row">
          <UserAvatar
            key={admin.userId}
            avatarSize="sm"
            firstName={admin.firstName}
            lastName={admin.lastName}
            avatar_url={admin.avatar_url ?? ""}
            onlineStatus="offline"
          />

          <VStack flex={1} flexDirection="row" flexWrap='wrap' mb="$4">
            <Heading size="sm" fontFamily="$heading" mb="$1">
              {admin.firstName} {admin.lastName}
            </Heading>
          </VStack>
        </Box>
      ))}
      {event.mapUrl &&
        (() => {
          const place = getPlaceFromUrl(event.mapUrl);
          if (place) {
            return (
              <HStack justifyContent="flex-end">
                <LocationLinkButton landmark={place} />
              </HStack>
            );
          } else {
            const { latitude, longitude } = getCoordinatesFromUrl(event.mapUrl);
            if (latitude !== 0 && longitude !== 0) {
              return (
                <HStack justifyContent="flex-end">
                  <LocationLinkButton latitude={latitude} longitude={longitude} />
                </HStack>
              );
            }
          }
        })()
      }
      {/* <AddressLinkAndIcon
        address={event.location}
        latitude={event.latitude}
        longitude={event.longitude}
      /> */}
    </Card>
  </ScrollView>
  );
};

export default ExternalEventCard;
