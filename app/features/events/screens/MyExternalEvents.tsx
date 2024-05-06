import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView as ReactScrollView } from 'react-native';
import { View } from 'react-native';
import { fetchExternalEvents } from '../services/eventService';
import { ExternalEventDetails } from '../../../api_schema/types';
import {
    Box,
    Divider, HStack, Heading, ScrollView,
    Text,
    Pressable,
    VStack,
    Icon,
} from '../../../gluestack-components';
import { useToken, } from "@gluestack-ui/themed"
import { LoadingScreen } from '../../common/screens/LoadingScreen';
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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { config } from "../../../gluestack-components/gluestack-ui.config";
import { AlarmClockCheckIcon, CalendarClockIcon, GalleryVerticalEndIcon, HourglassIcon, WatchIcon } from 'lucide-react-native';

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

export const MyExternalEvents = () => {
    const vscode_customLiteral = useToken("colors", "vscode_customLiteral")
    const vscode_numberLiteral = useToken("colors", "vscode_numberLiteral")
    const [events, setEvents] = useState<ExternalEventDetails[]>();
    const [groupedEvents, setGroupedEvents] = useState<{ [key: string]: ExternalEventDetails[] }>({});
    const [selectedEvent, setSelectedEvent] = useState<ExternalEventDetails | null>(events ? events[0] : null);
    const [nextEvent, setNextEvent] = useState<ExternalEventDetails | null>(events ? events[0] : null);
    const [didInitiallyScroll, setDidInitiallyScroll] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useStore();

    const scrollViewRef = useRef<ReactScrollView>(null);
    const nextEventMarkerRef = useRef<View>(null);

    useEffect(() => {
        fetchExternalEvents().then((events) => {
            events.sort((a, b) => {
                const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                return dateA - dateB;
            });

            const newGroupedEvents: { [key: string]: ExternalEventDetails[] } = events.reduce((grouped, event) => {
                const date = event.eventDate ? new Date(event.eventDate).toDateString() : 'No Date';
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(event);
                return grouped;
            }, {} as { [key: string]: ExternalEventDetails[] });

            setGroupedEvents(newGroupedEvents);
            setLoading(false);
        });
        console.log('fetching events');
    }, []);

    useEffect(() => {
        if (!groupedEvents || Object.keys(groupedEvents).length === 0) return;
        const findNextEvent = () => {
            const now = new Date();
            // const now = new Date(2024, 4, 9, 18, 10, 0);
            let nextEventTemp: ExternalEventDetails | null = null;
    
            for (const date in groupedEvents) {
                for (const event of groupedEvents[date]) {
                    if (!event.eventDate) continue;
                    
                    const eventDate = new Date(event.eventDate);
                    eventDate.setHours(parseInt(event.endTime.split(':')[0]), parseInt(event.endTime.split(':')[1]));
                    if (eventDate > now) {
                        nextEventTemp = event;
                        break;
                    }
                }
                if (nextEventTemp) break;
            }
            if (nextEventTemp?.eventId === groupedEvents[Object.keys(groupedEvents)[0]][0].eventId) {
                // Don't show the scroll to next event button if the next event is the first event of the first day
                nextEventTemp = null;
            }
            setNextEvent(nextEventTemp);
        };
        const intervalId = setInterval(findNextEvent, 60000); // Update every minute
        findNextEvent();

        return () => clearInterval(intervalId);
    }, [groupedEvents]);

    const handlePress = useCallback((event: ExternalEventDetails) => {
        setSelectedEvent(event);
    }, []);

    const scrollToCurrentEvent = useCallback(() => {
        if (!scrollViewRef.current || !nextEventMarkerRef.current) {
            console.log('Missing refs for scrolling to next event')
            return;
        }

        nextEventMarkerRef.current?.measureLayout(
            scrollViewRef.current.getInnerViewNode(),
            (_, y) => {
                scrollViewRef.current?.scrollTo({ y, animated: true });
            }
        );
    }, [nextEventMarkerRef, scrollViewRef]);

    useEffect(() => {
        if (nextEvent && !didInitiallyScroll) {
            scrollToCurrentEvent();
            setDidInitiallyScroll(true);
        }
    }, [nextEvent, didInitiallyScroll, scrollToCurrentEvent]);

    return (

        <VStack flex={1} space="sm" h="100%" bg="$background0">
            {selectedEvent && (
                <ExternalEventCardModal
                    event={selectedEvent}
                    open={!!selectedEvent}
                    onClose={() => {
                        setSelectedEvent(null)
                    }} />
            )}
            <HStack justifyContent="space-between" alignItems="center" height={50} paddingLeft={20}>
                <Heading size="xl">Mina bokade aktiviteter</Heading>
                {nextEvent && (

                        <Pressable
                            onPress={scrollToCurrentEvent}
                            paddingRight={15}
                            width={50}
                            height={50}
                            alignItems="center"
                            justifyContent='center'
                        >
                            <Icon as={CalendarClockIcon} size="xl" color="$primary200"/>
                        </Pressable>

                )}
            </HStack>
            <ScrollView flex={1} ref={scrollViewRef}>
                <VStack space="lg" flex={1} justifyContent="center">
                    {loading &&
                        <LoadingScreen />
                    }

                    {events && events.length === 0 &&
                        <Box alignItems='center' paddingVertical={40}>
                            <Text>Inga bokade aktiviteter</Text>
                        </Box>
                    }
                </VStack>
                {Object.keys(groupedEvents).map((date) => (
                    <VStack key={date} space="sm" paddingHorizontal={20}>
                        {nextEvent && nextEvent.eventId === groupedEvents[date][0].eventId && (
                            <View ref={nextEventMarkerRef} />
                        )}
                        <Heading color="$primary900" size="lg" >{displayLocaleTimeStringDate(date ?? "")}</Heading>
                        <Divider />
                        {groupedEvents[date].map((event) => (
                            <Pressable key={event.eventId} onPress={() => handlePress(event)} style={{opacity: event.eventDate && nextEvent && nextEvent.eventDate && event.eventDate < nextEvent?.eventDate ? 0.5 : 1.0}}>
                                {nextEvent && nextEvent.eventId == event.eventId && event.eventId != groupedEvents[date][0].eventId && (
                                    <View ref={nextEventMarkerRef} />
                                )}
                                <HStack space="sm" paddingVertical={10}>
                                    <VStack justifyContent="flex-start" alignItems="center">
                                        <Text size="md" color='$teal500' paddingTop={2}>
                                            {event.startTime}
                                        </Text>
                                        <Text size='md' color='$teal800'>
                                            {event.endTime}
                                        </Text>
                                    </VStack>
                                    <VStack flex={1} >
                                        <HStack space="md" justifyContent="space-between" alignItems="center">
                                            <Heading size="md" color="$primary600" style={{ flex: 1 }}>
                                                {event.titel}
                                            </Heading>
                                            <HStack space="sm" >
                                            {event.categories?.map((category, index) => (
                                                <Text key={index} color="$vscode_customLiteral" style={{ width: 30 }}>
                                                    {getEventCategoryBadge(category.code, `#${category.colorBackground}`)}
                                                </Text>
                                            ))}
                                            </HStack>
                                        </HStack>
                                        <Text color="$vscode_customLiteral" style={{ marginBottom: 10 }}>
                                            {/* <FontAwesomeIcon icon={faMountainCity} size={14} style={{ color: vscode_customLiteral, marginRight: 10 }} /> */}
                                            {event.location}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Pressable>
                        ))}

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