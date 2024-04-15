import {
  AlertDialog,
  Box,
  Button,
  Card,
  Column,
  Heading,
  Row,
  Text,
} from 'native-base';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, TouchableOpacity} from 'react-native';
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
import {useEventLists} from '../hooks/useEventLists';
import {SmallDeleteButton} from '../../common/components/SmallDeleteButton';

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

  const hostNames = isFutureUserEvent(event)
    ? [event.ownerName, ...(event.hostNames || [])]
    : [];

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
                  <Heading size="sm">{`Värd${
                    hostNames.length === 1 ? '' : 'ar'
                  }: `}</Heading>
                  <Text>{hostNames.join(', ')}</Text>
                </Box>

                {event.maxAttendees && (
                  <Box flex="1" flexDirection="row">
                    <Heading size="sm">Platser kvar: </Heading>
                    <Text>
                      {`${
                        event.maxAttendees - (event.attendees?.length || 0)
                      } av ${event.maxAttendees}`}
                    </Text>
                  </Box>
                )}
              </>
            )}
            <Box flex="1" flexDirection="row">
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
                  <Heading size="sm">Plats:</Heading>
                  <Text> {event.location?.description || ''}</Text>
                </>
              )}
            </Box>
            {user && isFutureUserEvent(event) && (
              <Attending event={event} userId={user.userId} />
            )}
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const Attending: React.FC<{
  event: FutureUserEvent;
  userId: number;
}> = ({event, userId}) => {
  const {attendEvent, unattendEvent} = useEventLists();

  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);

  if (
    event.userId === userId &&
    event.attendees !== undefined &&
    event.attendeeNames
  ) {
    return <AttendanceManager event={event} />;
  }

  const attending = event.attendees?.some(
    attendee => attendee.userId === userId,
  );

  const handlePressAttend = () => {
    setChangingAttendance(true);
    attendEvent(event)
      .catch(error => {
        console.log('Could not attend event', error);
      })
      .finally(() => {
        setChangingAttendance(false);
      });
  };

  const handlePressUnattend = () => {
    setChangingAttendance(true);
    unattendEvent(event)
      .catch(error => {
        console.log('Could not unattend event', error);
      })
      .finally(() => {
        setChangingAttendance(false);
      });
  };

  if (changingAttendance) {
    return <ActivityIndicator />;
  }

  if (attending) {
    return (
      <Column alignItems={'center'}>
        <Text>Du är anmäld!</Text>
        <Button onPress={handlePressUnattend}>Ta bort anmälan</Button>
      </Column>
    );
  } else {
    if (
      !event.maxAttendees ||
      (event.attendees && event.attendees.length < event.maxAttendees)
    ) {
      return (
        <Column alignItems={'center'}>
          <Button onPress={handlePressAttend}>Anmäl mig!</Button>
        </Column>
      );
    }
  }
};

const AttendanceManager: React.FC<{
  event: FutureUserEvent;
}> = ({event}) => {
  const {removeAttendee} = useEventLists();

  const [deletingAttendee, setDeleteingAttendee] = useState<boolean>(false);
  const [attendeeToDelete, setAttendeetoDelete] = useState<number | null>(null);
  const [attendeeToDeleteName, setAttendeetoDeleteName] = useState<string>('');

  useEffect(() => {
    if (attendeeToDelete !== null && event.attendeeNames) {
      const attendeeIndex = event.attendees?.findIndex(
        attendee => attendee.userId === attendeeToDelete,
      );
      if (attendeeIndex !== undefined && attendeeIndex !== -1) {
        setAttendeetoDeleteName(event.attendeeNames[attendeeIndex]);
      }
    }
  }, [attendeeToDelete, event.attendeeNames, event.attendees]);

  const handleConfirmDeleteAttendee = () => {
    setDeleteingAttendee(true);
    if (attendeeToDelete !== null) {
      removeAttendee(event, attendeeToDelete).finally(() => {
        setAttendeetoDelete(null);
        setDeleteingAttendee(false);
      });
    }
  };
  if (event.attendees !== undefined && event.attendeeNames) {
    return (
      <>
        <Box>
          <Heading size={'sm'}>Deltagarlista</Heading>
          {event.attendeeNames.length === 0 && <Text>Inga anmälda ännu</Text>}
          {event.attendeeNames?.map((name, i) => {
            if (!event.attendees) {
              return;
            }
            const attendeeUserId = event.attendees[i].userId;
            return (
              <Row justifyContent={'space-between'}>
                <Text key={`${event.id}-${attendeeUserId}`}>{name}</Text>
                <SmallDeleteButton
                  onPress={() => setAttendeetoDelete(attendeeUserId)}
                />
              </Row>
            );
          })}
        </Box>
        <AlertDialog isOpen={attendeeToDelete !== null}>
          <AlertDialog.Content>
            <AlertDialog.Header>
              <Heading size="sm">Ta bort deltagare</Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <Text>{`Är du säker på att du vill ta bort ${attendeeToDeleteName} från eventet?`}</Text>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button.Group space={2}>
                {deletingAttendee ? (
                  <Button disabled>
                    <ActivityIndicator />
                  </Button>
                ) : (
                  <Button onPress={handleConfirmDeleteAttendee}>Ja</Button>
                )}
                <Button
                  onPress={() => {
                    setAttendeetoDelete(null);
                  }}>
                  Nej
                </Button>
              </Button.Group>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      </>
    );
  }
  return <></>;
};

export default EventCard;
