import {Box, Card, Heading, Text} from 'native-base';
import React from 'react';
import {Event} from '../../types/event';
import {TouchableOpacity} from 'react-native';
import TimeLeft from '../utilities/TimeLeft';
import {clockForTime} from '../../functions/events';

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

const EventCard: React.FC<{
  event: Event;
}> = ({event}) => {
  const [comparisonDate, setComparisonDate] = React.useState(new Date());
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
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
              {event.name}
            </Heading>
            <TimeLeft
              comparedTo={comparisonDate}
              start={event.start !== undefined ? event.start : ''}
              end={event.end}
              long
            />
          </Box>
          <Heading size="lg" isTruncated={!open}>
            {event.location.marker ?? clockForTime(event.start)}
          </Heading>
        </Box>
        {open && (
          <>
            <Text mt="5">{event.description}</Text>
            <Box flex="1" flexDirection="row" justifyContent="space-between">
              <Heading size="xs" mt="5">
                {formatDateAndTime(event.start)}
                {event.end && ' – ' + formatDateAndTime(event.end, event.start)}
              </Heading>
              {event.location.description && (
                <Heading size="xs" mt="5">
                  {event.location.description}
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