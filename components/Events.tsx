import {Box, Card, Center, Heading, ScrollView, Text} from 'native-base';
import React from 'react';
import {Event} from '../types/event';
import {RefreshControl, TouchableNativeFeedback} from 'react-native';
import useStore from '../store';
import apiClient from '../apiClient';
import {LayoutAnimation, UIManager, Platform} from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatDateAndTime(dateTimeStr: string, startDateTimeStr?: string) {
  // Parse the Swedish date and time format, assuming it's in "yyyy-mm-dd hh:mm" format
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);

  let formattedDate = '';

  // If the date is further in the future than 6 months, show the year,
  // so here's a value to compare to (days > 100)
  const now = new Date();
  const date = new Date(year, month - 1, day);
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // If there's a start date provided, this is the end date of an event and
  // then we only show the date if it's different from the start date
  if (startDateTimeStr) {
    const [startDatePart] = startDateTimeStr.split(' ');
    if (startDatePart !== datePart) {
      if (days > 180) {
        formattedDate = `${day}/${month} ${year}`;
      } else {
        formattedDate = `${day}/${month}`;
      }
    }
  } else {
    if (days > 180) {
      formattedDate = `${day}/${month} ${year}`;
    } else {
      formattedDate = `${day}/${month}`;
    }
  }

  // If there is a time part, format it and append to the date string
  if (timePart) {
    const [hours, minutes] = timePart.split(':');
    if (formattedDate === '') {
      return `${hours}${minutes === '00' ? '' : ':' + minutes}`;
    } else {
      return `${formattedDate} kl ${hours}${
        minutes === '00' ? '' : ':' + minutes
      }`;
    }
  }

  return formattedDate;
}

const timeUntil = (
  comparedTo: Date,
  dateTimeStr: string,
  long: boolean = false,
) => {
  const dateTime = new Date(dateTimeStr);

  const diff = dateTime.getTime() - comparedTo.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (!long) {
    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}t`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  } else {
    // Show all units that are not zero
    let timeLeft = '';
    if (days !== 0) {
      timeLeft += `${days} dag${days > 1 ? 'ar' : ''}`;
    }
    if (hours > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${hours} timma${
        hours !== 1 ? 'r' : ''
      }`;
    }
    if (minutes > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${minutes} minut${
        minutes !== 1 ? 'er' : ''
      }`;
    }
    if (hours === 0 && minutes < 10) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${seconds} sekund${
        seconds !== 1 ? 'er' : ''
      }`;
    }
    return timeLeft;
  }
};

const TimeLeft: React.FC<{
  comparedTo: Date;
  start: string;
  end?: string;
  long?: boolean;
}> = ({comparedTo, start, end, long}) => {
  // If start hasn't passed:
  let text = '';
  if (new Date(start) > new Date()) {
    text = `om ${timeUntil(comparedTo, start, long ?? false)}`;
  } else if (end) {
    text = `slutar om ${timeUntil(comparedTo, end, long ?? false)}`;
  } else {
    // Show how long ago the event started
    text = `${timeUntil(comparedTo, start)} sedan`;
  }
  return <Text>{text}</Text>;
};

const EventCard: React.FC<{
  comparisonDate: Date;
  event: Event;
  open: Boolean;
  toggleOpen: (event: Event) => void;
}> = ({comparisonDate, event, open, toggleOpen}) => {
  return (
    <TouchableNativeFeedback onPress={() => toggleOpen(event)}>
      <Card rounded="lg" overflow="hidden" m="2" opacity={open ? '1' : '0.8'}>
        {open ? (
          <>
            <Box flexDirection="row-reverse">
              <TimeLeft
                comparedTo={comparisonDate}
                start={event.start}
                end={event.end}
                long
              />
            </Box>
            <Heading size="lg" isTruncated={!open}>
              {event.name}
            </Heading>
          </>
        ) : (
          <Box flex="1" flexDirection="row" justifyContent="space-between">
            <Heading size="sm" isTruncated maxW="80%">
              {event.name}
            </Heading>
            <TimeLeft
              comparedTo={comparisonDate}
              start={event.start}
              end={event.end}
            />
          </Box>
        )}
        {open && (
          <>
            <Text mt="5">{event.description}</Text>
            <Box flex="1" flexDirection="row" justifyContent="space-between">
              <Heading size="xs" mt="5">
                {formatDateAndTime(event.start)}
                {event.end && ' – ' + formatDateAndTime(event.end, event.start)}
              </Heading>
              <Text mt="5">{event.location.description}</Text>
            </Box>
          </>
        )}
      </Card>
    </TouchableNativeFeedback>
  );
};

const Events: React.FC = () => {
  const {
    userEvents,
    setUserEvents,
    showUserEvents,
    staticEvents,
    setStaticEvents,
    showStaticEvents,
  } = useStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [events, setEvents] = React.useState<Array<Event>>([]);
  const [openEvents, setOpenEvents] = React.useState<Array<Event>>([]);

  const [comparisonDate, setComparisonDate] = React.useState(new Date());

  const toggleOpen = (event: Event) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (openEvents.includes(event)) {
      setOpenEvents(openEvents.filter(e => e !== event));
    } else {
      setOpenEvents([...openEvents, event]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing events...');

    const userEventsPromise = apiClient
      .get('/event')
      .then(response => {
        if (response.status === 200) {
          setUserEvents(response.data);
        } else {
          console.log('Error fetching user events', response.status);
        }
      })
      .catch(error => {
        console.error('Error fetching user events', error);
      });

    const staticEventsPromise = apiClient
      .get('/static_events')
      .then(response => {
        if (response.status === 200) {
          setStaticEvents(response.data);
        } else {
          console.log('Error fetching static events', response.status);
        }
      })
      .catch(error => {
        console.error('Error fetching static events', error);
      });

    // Wait for both promises to complete, regardless of whether they resolve or reject
    Promise.all([userEventsPromise, staticEventsPromise]).finally(() => {
      setRefreshing(false);
    });
  }, [setStaticEvents, setUserEvents]);

  // Trigger onRefresh on component mount
  React.useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setComparisonDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const newEvents: Event[] = [];
    if (showUserEvents) {
      newEvents.push(...userEvents);
    }
    if (showStaticEvents) {
      newEvents.push(...staticEvents);
    }

    const filteredEvents = newEvents.filter(event => {
      // If the event has an end, and it has passed, filter it out
      if (event.end && new Date(event.end) < new Date()) {
        return false;
      }
      // If the event has no end, and it has passed, filter it out
      if (new Date(event.start) < new Date()) {
        return false;
      }

      return true;
    });

    setEvents(filteredEvents);
  }, [showUserEvents, showStaticEvents, userEvents, staticEvents]);

  return (
    <Center w="100%" h="100%">
      <ScrollView
        w="100%"
        h="100%"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {events.length === 0 && (
          <Center w="100%" p={10}>
            <Text>Inga evenemang hittades</Text>
          </Center>
        )}
        {events.map((event: Event) => (
          <EventCard
            key={event.id}
            comparisonDate={comparisonDate}
            event={event}
            open={openEvents.includes(event)}
            toggleOpen={toggleOpen}
          />
        ))}
      </ScrollView>
    </Center>
  );
};

export default Events;
