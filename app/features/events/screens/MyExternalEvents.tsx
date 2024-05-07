import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';  // Make sure this is imported
import { fetchExternalEvents } from '../services/eventService';
import { ExternalEventDetails } from '../../../api_schema/types';
import {
    Box,
    Divider, HStack, Heading, ScrollView,
    Text,
    Pressable,
    VStack,
} from '../../../gluestack-components';
import { useToken, } from "@gluestack-ui/themed"
import useStore from '../../common/store/store';
import NonMemberInfo from '../../common/components/NonMemberInfo';
import {
    FootprintsBadge,
    GameBadge,
    GlobeBadge,
    LectureBadge,
    MicVocalBadge,
    PartyBadge,
    TeenBadge,
    WorkshopBadge
} from '../components/EventBadges';
import ExternalEventCardModal from '../components/ExternalEventCardModal';
import EventCardModal from '../components/EventCardModal';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { useEventLists } from '../hooks/useEventLists';
import FutureUserEvent from '../types/futureUserEvent';


export const displayLocaleTimeStringDate = (datestring: string) => {
    const date: Date = new Date(datestring ?? "");
    const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${capitalizedWeekday} ${dayMonth}`;
}

const getEventCategoryBadge = (categoryCode: string, color: string) => {
    switch (categoryCode) {
        case 'F': // föreläsning
            return <LectureBadge color="$primary500" />;
        case 'Fö': // föreningsarbete
            return <GlobeBadge color="$darkBlue700" />;
        case 'M': // middag/festligheter
            return <PartyBadge color="$pink700" />;
        case 'S': // spel/tävling
            return <GameBadge color="$secondary600" />;
        case 'U': // ungdomsaktivitet
            return <TeenBadge color="$fuchsia500" />;
        case 'Up': //uppträdande
            return <MicVocalBadge color="$amber600" />;
        case 'Ut': // utflykt
            return <FootprintsBadge color="$lime600" />;
        case 'W': // workshop
            return <WorkshopBadge color="$purple600" />;
        default:
            return null; // Return null or some default icon when the category code doesn't match any known codes
    }
}

type EventItem = ExternalEventDetails | FutureUserEvent;

export const MyExternalEvents = () => {
    const vscode_customLiteral = useToken("colors", "vscode_customLiteral")
    const vscode_numberLiteral = useToken("colors", "vscode_numberLiteral")
    const [events, setEvents] = useState<ExternalEventDetails[]>();
    const [groupedEvents, setGroupedEvents] = useState<{ [key: string]: (EventItem)[] }>({});
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(events ? events[0] : null);
    const [loading, setLoading] = useState(false);
    const { user } = useStore();


    const {
        visibleEvents,
        eventsRefreshing,
        fetchAllEvents,
        subscribe,
        unsubscribe,
    } = useEventLists();

    React.useEffect(() => {
        subscribe('schedule view');
        return () => {
        unsubscribe('schedule view');
        };
    }, [subscribe, unsubscribe]);

    useEffect(() => {
        const myUserEvents = user
            ? (visibleEvents as FutureUserEvent[]).filter(
                  e =>
                      e.attendees?.includes({ userId: user.userId }) ||
                      e.hosts?.includes({ userId: user.userId }) ||
                      e.userId === user.userId,
              )
            : [];
        const allEvents: EventItem[] = [...myUserEvents, ...(events ?? [])];
        const newGroupedEvents: { [key: string]: EventItem[] } =
            allEvents.reduce((grouped, event) => {
                let date: string = '';
                if ('eventDate' in event && event.eventDate) {
                    date = new Date(event.eventDate).toDateString();
                } else if ('start' in event && event.start) {
                    date = new Date(event.start).toDateString();
                }
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(event);
                return grouped;
            }, {} as { [key: string]: EventItem[] });
        setGroupedEvents(newGroupedEvents);
    }, [user, events, visibleEvents]);

    const onRefresh = useCallback(() => {
        setLoading(true);
        
        fetchExternalEvents().then((events) => {
            events.sort((a, b) => {
                const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                return dateA - dateB;
            });
            setEvents(events);
            setLoading(false);
        });

        fetchAllEvents();
        
        console.log('fetching events');
    }, []);

    useEffect(() => {
        onRefresh();
    }, [onRefresh]);

    const handlePress = useCallback((event: EventItem) => {
        setSelectedEvent(event);
    }, []);

    return (

        <VStack flex={1} space="sm" h="100%" bg="$background0">
            {selectedEvent && 'eventDate' in selectedEvent && (
                <ExternalEventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null)
                    }} />
            )}
            {selectedEvent && 'start' in selectedEvent && (
                <EventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null)
                    }} />
            )}
            <Heading size="xl" paddingHorizontal={20}>Mina bokade aktiviteter</Heading>
            <ScrollView flex={1}
                refreshControl={
                    <RefreshControl
                        refreshing={loading || eventsRefreshing}
                        onRefresh={onRefresh}
                        tintColor={config.tokens.colors.secondary300}
                        colors={[config.tokens.colors.secondary300]}
                    />
                }>
                <VStack space="lg" flex={1} justifyContent="center">
                    {events && events.length === 0 &&
                        <Box alignItems='center' paddingVertical={40}>
                            <Text>Inga bokade aktiviteter</Text>
                        </Box>
                    }
                </VStack>
                {Object.keys(groupedEvents).map((date) => (

                    <VStack key={date} space="sm" paddingHorizontal={20}>
                        <Heading color="$primary900" size="lg" >{displayLocaleTimeStringDate(date ?? "")}</Heading>
                        <Divider />
                        {groupedEvents[date].map((event) => {

                            if ('eventDate' in event) return (
                                <Pressable key={event.eventId} onPress={() => handlePress(event)}>
                                    <HStack key={event.eventId} space="sm" paddingVertical={10}>
                                        <VStack justifyContent="flex-start" alignItems="center">
                                            <Text size="md" color='$teal500' paddingTop={2}>
                                                {event.startTime}
                                            </Text>
                                            <Text size='md' color='$teal800'>
                                                {event.endTime}
                                            </Text>
                                        </VStack>
                                        <VStack flex={1} paddingLeft={10}>
                                            <HStack space="md" justifyContent="space-between" alignItems="center">
                                                <Heading size="md" color="$primary600" style={{ flex: 1 }}>
                                                    {event.titel}
                                                </Heading>
                                                {event.categories?.map((category, index) => (
                                                    <Text key={index} color="$vscode_customLiteral" style={{ paddingLeft: 10, maxWidth: 45 }}>
                                                        {getEventCategoryBadge(category.code, `#${category.colorBackground}`)}
                                                    </Text>
                                                ))}
                                            </HStack>
                                            <Text color="$vscode_customLiteral" style={{ marginBottom: 10 }}>
                                                {/* <FontAwesomeIcon icon={faMountainCity} size={14} style={{ color: vscode_customLiteral, marginRight: 10 }} /> */}
                                                {event.location}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Pressable>
                            );

                            if ('start' in event) return (
                                <Pressable key={event.id} onPress={() => handlePress(event)}>
                                    <HStack key={event.id} space="sm" paddingVertical={10}>
                                        <VStack justifyContent="flex-start" alignItems="center">
                                            <Text size="md" color='$teal500' paddingTop={2}>
                                                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            {event.end && (
                                            <Text size='md' color='$teal800'>
                                                {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            )}
                                        </VStack>
                                        <VStack flex={1} paddingLeft={10}>
                                            <HStack space="md" justifyContent="space-between" alignItems="center">
                                                <Heading size="md" color="$primary600" style={{ flex: 1 }}>
                                                    {event.name}
                                                </Heading>
                                            </HStack>
                                            <Text color="$vscode_customLiteral" style={{ marginBottom: 10 }}>
                                                {/* <FontAwesomeIcon icon={faMountainCity} size={14} style={{ color: vscode_customLiteral, marginRight: 10 }} /> */}
                                                {event.location?.description}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                </Pressable>
                            );
                        })}

                    </VStack>

                ))}

            </ScrollView>
            {user && !user.isMember && (
                <NonMemberInfo />
            )}
        </VStack>
    );
}


export default MyExternalEvents;