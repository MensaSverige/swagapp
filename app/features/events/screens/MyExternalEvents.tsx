import React, { useEffect, useState } from 'react';
import { fetchExternalEvents } from '../services/eventService';
import { ExternalEventDetails } from '../../../api_schema/types';
import { Accordion, AccordionContent, AccordionContentText, AccordionHeader, AccordionIcon, AccordionItem, AccordionTitleText, AccordionTrigger, ChevronDownIcon, ChevronUpIcon, Divider, HStack, Heading, ScrollView, Spinner, Text, VStack } from '../../../gluestack-components';
import { parseHTML } from '../../common/functions/formatHtml';
import { LoadingScreen } from '../../common/screens/LoadingScreen';
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

export const MyExternalEvents = () => {
    const [events, setEvents] = useState<ExternalEventDetails[]>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExternalEvents().then((events) => {
            events.sort((a, b) => {
                const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                return dateA - dateB;
            });
            setEvents(events);
            setLoading(false);
        });
    }, []);

    return (

        <VStack flex={1} space="sm" h="100%" bg="$background0">
            <Heading size="xl" paddingHorizontal={20}>Mina bokade aktiviteter</Heading>
            <ScrollView flex={1}>
                <VStack space="lg" flex={1} justifyContent="center">
                    {loading &&
                        <LoadingScreen />
                    }

                    {events && events.length === 0 &&
                        <Text>Inga bokade aktiviteter</Text>
                    }
                </VStack>
                {events &&
                    <Accordion size="md" width="100%" variant="unfilled" type="multiple" isCollapsible={true} isDisabled={false}>
                        {events.map((event) => (
                            <AccordionItem value={event.eventId.toString()} key={event.eventId}>
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        {({ isExpanded }: { isExpanded: boolean }) => {
                                            return (
                                                <VStack flex={1}>
                                                    <HStack flex={1}>
                                                        <VStack flex={1}>
                                                            <AccordionTitleText color="$text800">
                                                                {event.titel}
                                                            </AccordionTitleText>
                                                            <AccordionTitleText color="$secondary600">
                                                                {(() => {
                                                                    const date: Date = new Date(event.eventDate ?? "");
                                                                    const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
                                                                    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                                                                    const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
                                                                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                                    return `${capitalizedWeekday} ${dayMonth} kl ${time}`;
                                                                })()}
                                                            </AccordionTitleText>
                                                            <AccordionTitleText color="$primary300">
                                                                {event.location}
                                                            </AccordionTitleText>

                                                        </VStack>

                                                        {isExpanded ? (
                                                            <AccordionIcon as={ChevronUpIcon} ml="$3" />
                                                        ) : (
                                                            <AccordionIcon as={ChevronDownIcon} ml="$3" />
                                                        )}
                                                    </HStack>
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
                                                </VStack>
                                            );
                                        }}
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>

                                    <AccordionContentText>
                                        {parseHTML(event.description)}
                                    </AccordionContentText>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                }
            </ScrollView>
        </VStack>

    );
}


export default MyExternalEvents;