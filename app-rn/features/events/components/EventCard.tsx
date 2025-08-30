import {
  AlertDialog,
  Badge,
  BadgeText,
  Box,
  Button,
  ButtonText,
  Card,
  Heading,
  HStack,
  Text,
  VStack,
} from '../../../gluestack-components';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import TimeLeft from '../utilities/TimeLeft';
import { useColorMode } from '@gluestack-ui/themed';
import FutureUserEvent, { isFutureUserEvent } from '../types/futureUserEvent';
import useStore from '../../common/store/store';
import { formatDateAndTime } from '../../common/functions/FormatDateAndTime';
import FutureEvent from '../types/futureEvent';
import { useEventLists } from '../hooks/useEventLists';
import { SmallDeleteButton } from '../../common/components/SmallDeleteButton';
import { EditButton } from '../../common/components/EditButton';
import { BadgeCheckIcon } from 'lucide-react-native';
import { AddressLinkAndIcon } from '../../map/components/AddressLinkAndIcon';

const EventCard: React.FC<{
  event: FutureEvent | FutureUserEvent;
  initiallyOpen?: boolean;
  onEditEvent: (event: FutureUserEvent) => void;
}> = ({ event, initiallyOpen = false, onEditEvent }) => {
  const colorMode = useColorMode();
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

  const onEditPress = () => {
    onEditEvent(event);
  };

  return (
    <TouchableOpacity onPress={() => setOpen(!open)}>
      <Card padding={10} size="sm" variant="elevated" m="$0">
        <Box
          flex={1}
          flexDirection="row"
          justifyContent="space-between"
          alignItems={'center'}>
          <Box flex={1} flexDirection="column">
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

          {isFutureUserEvent(event) && event.userId === user?.userId && (
            <EditButton onPress={onEditPress} />
          )}
          {user?.userId && isUserAttending(event, user?.userId) &&
            <Badge size="lg" variant="outline" borderRadius="$full" action="success">
              <BadgeText>Anmäld</BadgeText>
            </Badge>
          }

        </Box>
        {open && (
          <>

            <Text>{event.description}</Text>

            {isFutureUserEvent(event) && (
              <>
                <HStack flex={1} flexDirection="row" flexWrap='wrap'>
                  <Heading size="sm">{`Värd${hostNames.length === 1 ? '' : 'ar'
                    }: `}</Heading>
                  <Text>{hostNames.join(', ')}</Text>
                </HStack>

                {event.maxAttendees && (
                  <HStack flex={1} flexDirection="row" flexWrap='wrap'>
                    <Heading size="sm">Platser kvar: </Heading>
                    <Text>
                      {`${event.maxAttendees - (event.attendees?.length || 0)
                        } av ${event.maxAttendees}`}
                    </Text>
                  </HStack>
                )}
              </>
            )}
            <HStack flex={1} flexDirection="row" flexWrap='wrap'>
              <Heading size="sm">Start:</Heading>
              <Text> {formatDateAndTime(event.start)}</Text>
            </HStack>
            {event.end && (
              <HStack flex={1} flexDirection="row" flexWrap='wrap'>
                <Heading size="sm">Slut:</Heading>
                <Text> {formatDateAndTime(event.end)}</Text>
              </HStack>
            )}
            <VStack space="sm" flex={1} paddingVertical={5}>
              <Heading size="sm">Plats: </Heading>
              {event.location?.address && (
                <HStack flex={1} flexDirection="row" flexWrap='wrap'>
                  <AddressLinkAndIcon
                    displayName={
                      event.location.address.includes(', Sweden')
                      ? event.location.address.replace(', Sweden', '')
                      : event.location.address
                    }
                    address={event.location.address}
                  />
                </HStack>
              )}
              {event.location?.description && (
                <HStack flex={1} flexDirection="row" flexWrap='wrap'>
                  <Text>{event.location?.description || ''}</Text>
                </HStack>
              )}
            </VStack>
            {user && isFutureUserEvent(event) && (
              <Attending event={event} userId={user.userId} />
            )}
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
};

export const isUserAttending = (event: FutureUserEvent, userId: number) => {
  return event.attendees?.some(
    attendee => attendee.userId === userId,
  );
};

const Attending: React.FC<{
  event: FutureUserEvent;
  userId: number;
}> = ({ event, userId }) => {
  const { attendEvent, unattendEvent } = useEventLists();

  const [changingAttendance, setChangingAttendance] = useState<boolean>(false);

  if (
    event.userId === userId &&
    event.attendees !== undefined &&
    event.attendeeNames
  ) {
    return <AttendanceManager event={event} />;
  }

  const attending = isUserAttending(event, userId);

  const handlePressAttend = () => {
    setChangingAttendance(true);
    attendEvent(event)
      .catch(error => {
        console.error('Could not attend event', error);
      })
      .finally(() => {
        setChangingAttendance(false);
      });
  };

  const handlePressUnattend = () => {
    setChangingAttendance(true);
    unattendEvent(event)
      .catch(error => {
        console.error('Could not unattend event', error);
      })
      .finally(() => {
        setChangingAttendance(false);
      });
  };

  if (changingAttendance) {
    return (
      <Box mt={10}>
        <ActivityIndicator />
      </Box>
    );
  }

  if (attending) {
    return (
      <VStack flex={1} gap={5} mt={10}>
        <Button onPress={handlePressUnattend} style={{ width: '100%' }}>
          <ButtonText style={{ textAlign: 'center' }}>
            Ta bort anmälan
          </ButtonText>
        </Button>
      </VStack>
    );
  } else {
    if (
      !event.maxAttendees ||
      (event.attendees && event.attendees.length < event.maxAttendees)
    ) {
      return (
        <VStack flex={1} mt={10}>
          <Button onPress={handlePressAttend} style={{ width: '100%' }}>
            <ButtonText style={{ textAlign: 'center' }}>Anmäl mig!</ButtonText>
          </Button>
        </VStack>
      );
    }
  }
};

const AttendanceManager: React.FC<{
  event: FutureUserEvent;
}> = ({ event }) => {
  const { removeAttendee } = useEventLists();

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
              <HStack justifyContent={'space-between'}>
                <Text key={`${event.id}-${attendeeUserId}`}>{name}</Text>
                <SmallDeleteButton
                  onPress={() => setAttendeetoDelete(attendeeUserId)}
                />
              </HStack>
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
              <Button.Group space="sm">
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
