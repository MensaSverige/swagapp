import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fetchNews } from '../../events/services/eventService';
import { News } from '../../../api_schema/types';
import { Heading, ScrollView, VStack } from '../../../gluestack-components';
import { parseHTML } from '../functions/formatHtml';


export const NewsScreen = () => {
    const [news, setNews] = useState<News[]>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews().then((news) => {
            news.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });
            setNews(news);
        });
        setLoading(false);
    }, []);

    return (
        <ScrollView>
            <VStack space="lg" h="100%" bg="$background0" flex={1} paddingHorizontal={20}>
                <Heading>Nyheter</Heading>
                {loading && <Text>Laddar..</Text>}

                {news && news.length === 0 &&
                    <Text>Inga nyheter</Text>
                }
                {news &&
                    news.map((event) => (
                        <VStack key={event.title}>
                            <Heading>{event.title}</Heading>
                            <Text>
                                {new Date(event.date ?? "").toLocaleDateString()}{' '}
                                {new Date(event.date ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text>{parseHTML(event.description)}</Text>
                        </VStack>
                    ))
                }
            </VStack>
        </ScrollView>
    );
};

export default NewsScreen;