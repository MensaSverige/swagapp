import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { fetchNews } from '../../events/services/eventService';
import { News } from '../../../api_schema/types';
import { Card, Heading, Link, LinkText, ScrollView, Spinner, Text, VStack } from '../../../gluestack-components';
import { parseHTML } from '../functions/formatHtml';
import { LoadingScreen } from './LoadingScreen';

export const SiteNews = () => {
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
            setLoading(false);
        });      
    }, []);

    const extractLinks = (html: string) => {
        const linkRegex = /<a href="(.*?)">(.*?)<\/a>/g;
        const links = [];
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            let name = match[2];
            name = name.replace(/en\s/g, '');
            name = name.charAt(0).toUpperCase() + name.slice(1);
            links.push({ url: match[1], name: name });
        }
        return links;
    };

    return (

        <VStack space="lg" h="100%" bg="$background0" flex={1}>
            <Heading size="xl" >Information från arrangörerna</Heading>
            <ScrollView>
                <VStack space="lg" flex={1} justifyContent="center">
                    {loading &&
                        <LoadingScreen/>
                    }

                    {news && news.length === 0 &&
                        <Text> Inga nyheter</Text>
                    }
                </VStack>
                {news &&
                    news.map((news) => (
                        <Card key={news.title} paddingHorizontal={0} size="sm" variant="ghost" m="$0" >
                            <Heading color="$amber200">{parseHTML(news.title ?? "")}</Heading>
                            <Text color="$secondary600">
                                {new Date(news.date ?? "").toLocaleDateString()}{' '}
                                {new Date(news.date ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text>{parseHTML(news.description)}</Text>
                            {extractLinks(news.description)?.map((link, index) => (


                                <Link href={link.url} key={index}>
                                    <LinkText>{link.name}</LinkText>
                                </Link>
                            ))}
                        </Card>
                    ))
                }
            </ScrollView>
        </VStack>

    );
};

export default SiteNews;