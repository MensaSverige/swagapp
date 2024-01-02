import {Box, Card, Heading, ICustomTheme, Text, useTheme} from 'native-base';
import React, {useEffect} from 'react';
import {TouchableOpacity} from 'react-native';
import TimeLeft from '../utilities/TimeLeft';
import { clockForTime } from '../../map/functions/clockForTime';
import {Event} from '../../common/types/event';
import {isFutureUserEvent} from '../types/futureUserEvent';
import useStore from '../../common/store/store';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../navigation/RootStackParamList';
import {EditButton} from '../../common/components/EditButton';

function formatDateAndTime(dateTimeStr: string, startDateTimeStr?: string) {
  const datetime = new Date(dateTimeStr);
  const timePart = datetime.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const datePart = datetime.toLocaleDateString('sv-SE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let formattedDate = '';

  // Calculate the difference in days
  const now = new Date();
  const diff = datetime.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Determine whether to show the year
  if (days > 180) {
    formattedDate = datePart;
  } else {
    formattedDate = datePart.slice(0, -5); // Remove year
  }

  // For end date, only show if different from start date
  if (startDateTimeStr) {
    const startDate = new Date(startDateTimeStr);
    const startDatePart = startDate.toLocaleDateString('sv-SE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    if (startDatePart === datePart) {
      formattedDate = ''; // Same date, don't repeat
    }
  }

  // Time part formatting
  if (timePart !== '00:00') {
    // Assuming '00:00' means no specific time
    return (formattedDate ? formattedDate + ' kl ' : '') + timePart;
  }

  return formattedDate;
}

const createStyles = (theme: ICustomTheme) => ({
  editButton: {
    color: theme.colors.accent[500],
  },
});

const EventCard: React.FC<{
  event: Event;
  initiallyOpen?: boolean;
}> = ({event, initiallyOpen = false}) => {
  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);
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
  useEffect(() => {
    //update if event changes
  }, [
    event,
    event.start,
    event.end,
    event.location?.marker,
    event.description,
  ]);

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
              end={event.end}
              long
            />
          </Box>

          {open &&
          isFutureUserEvent(event) &&
          event.owner === user?.username ? (
              <EditButton onPress={() => {
                console.log('Edit event', event);
                navigation.navigate('EventForm', {event: event});
              }}/>
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
              <Heading size="sm">Värd: {event.owner}</Heading>
            )}
            <Box flex="1" flexDirection="row" justifyContent="space-between">
              <Heading size="xs" mt="5">
                {formatDateAndTime(event.start)}
                {event.end && ' – ' + formatDateAndTime(event.end, event.start)}
              </Heading>
              {event.location?.description && (
                <Heading size="xs" mt="5">
                  {event.location?.description || ''}
                </Heading>
              )}
            </Box>
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export default EventCard;
