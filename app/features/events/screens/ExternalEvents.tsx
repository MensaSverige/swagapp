import React, { useEffect, useState } from 'react';
import { fetchExternalEvents } from '../services/eventService';
import { ExternalEventDetails } from '../../../api_schema/types';
import { Heading, ScrollView, Text, VStack } from '../../../gluestack-components';

function parseHTML(htmlString: string) {
    // Replace HTML tags with corresponding React Native components
    const replacedText = htmlString
        .replace(/<b>(.*?)<\/b>/g, '$1')  // handle <b> tags
        .replace(/<strong>(.*?)<\/strong>/g, '$1')  // handle <strong> tags
        .replace(/<em>(.*?)<\/em>/g, '$1')  // handle <em> tags
        .replace(/&amp;/g, '&');  // handle &amp; entities
    return replacedText;
}
export const ExternalEvents = () => {
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
        });
        setLoading(false);
    }, []);

    return (
        <ScrollView>
            <VStack space="lg" h="100%" bg="$background0" flex={1} paddingHorizontal={20}>
                <Heading>Mina bokade aktiviteter</Heading>
                {loading && <Text>Laddar..</Text>}

                {events && events.length === 0 &&
                    <Text>Inga bokade aktiviteter</Text>
                }
                {events &&
                    events.map((event) => (
                        <VStack key={event.eventId}>
                            <Heading>{event.titel}</Heading>
                            <Text>
                                {new Date(event.eventDate ?? "").toLocaleDateString()}{' '}
                                {new Date(event.eventDate ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text>{parseHTML(event.description)}</Text>
                        </VStack>
                    ))
                }
            </VStack>
        </ScrollView>
    );
};

export default ExternalEvents;