import {Box, Card, Heading, Text} from 'native-base';
import React, {useEffect} from 'react';
import {TouchableOpacity} from 'react-native';
import TimeLeft from '../utilities/TimeLeft';
import {clockForTime} from '../../map/functions/clockForTime';
import FutureUserEvent, {isFutureUserEvent} from '../types/futureUserEvent';
import useStore from '../../common/store/store';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../navigation/RootStackParamList';
import {EditButton} from '../../common/components/EditButton';
import {formatDateAndTime} from '../../common/functions/FormatDateAndTime';
import FutureEvent from '../types/futureEvent';

const EventCard: React.FC<{
  event: FutureEvent | FutureUserEvent;
  initiallyOpen?: boolean;
}> = ({event, initiallyOpen = false}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useStore(state => state.user);
  const [open, setOpen] = React.useState(initiallyOpen || false);
  const [comparisonDate, setComparisonDate] = React.useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setComparisonDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity onPress={() => setOpen(!open)}>
      <Card rounded="lg" overflow="hidden" m="2" opacity={open ? '1' : '0.8'}>
        <Box
          flex="1"
          flexDirection="row"
          justifyContent="space-between"
          alignItems={'center'}>
          <Box flex="1" flexDirection="column">
            <Heading
              size={open ? 'lg' : 'sm'}
              isTruncated={!open}
              flexShrink={1}>
              {event.name || 'Inget namn'}
            </Heading>
            <TimeLeft
              comparedTo={comparisonDate}
              start={event.start !== undefined ? event.start : ''}
              end={event.end ?? undefined}
              long
            />
          </Box>

          {open && isFutureUserEvent(event) && event.userId === user?.userId ? (
            <EditButton
              onPress={() => {
                console.log('Edit event', event);
                navigation.navigate('EventForm', {event: event});
              }}
            />
          ) : (
            <Heading size="lg" isTruncated={!open}>
              {event.location?.marker || clockForTime(event.start)}
            </Heading>
          )}
        </Box>
        {open && (
          <>
            <Text mt="5">{event.description}</Text>
            {isFutureUserEvent(event) && (
              <>
                <Box flex="1" flexDirection="row" mt="5">
                  <Heading size="sm">Värdar:</Heading>
                  <Text>
                    {(event.hostNames && event.hostNames.length
                      ? event.hostNames
                      : [event.ownerName]
                    ).join(', ')}
                  </Text>
                </Box>

                {event.maxAttendees && (
                  <Box flex="1" flexDirection="row" mt="5">
                    <Heading size="sm">Platser: </Heading>
                    <Text>
                      {`${
                        event.maxAttendees - (event.attendees?.length || 0)
                      } av ${event.maxAttendees}`}
                    </Text>
                  </Box>
                )}
              </>
            )}
            <Box flex="1" flexDirection="row" mt="5">
              <Heading size="sm">Start:</Heading>
              <Text> {formatDateAndTime(event.start)}</Text>
            </Box>
            {event.end && (
              <Box flex="1" flexDirection="row">
                <Heading size="sm">Slut:</Heading>
                <Text> {formatDateAndTime(event.end)}</Text>
              </Box>
            )}
            <Box flex="1" flexDirection="row" mt="5">
              {event.location?.description && (
                <>
                  <Heading size="sm">Platsbeskrivning:</Heading>
                  <Text> {event.location?.description || ''}</Text>
                </>
              )}
            </Box>
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export default EventCard;
