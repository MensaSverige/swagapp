import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { fetchNews } from '../../events/services/eventService';
import { News } from '../../../api_schema/types';
import { filterHtml } from '../functions/filterHtml';
import { extractLinks } from '../functions/extractLinks';
import { ThemedText } from '@/components/ThemedText';
import * as Linking from 'expo-linking';

export const SiteNews = () => {
    const [news, setNews] = useState<News[]>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews().then((news) => {
            console.log('Fetched news:', news);
            news.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });
            setNews(news);
            setLoading(false);
        }).catch(() => {
            console.log('Failed to fetch news');
            setLoading(false);
        });
    }, []);


    return (
        <>
            {!loading && news && news.length > 0 && (
                <View>
                    <ThemedText type='title'>Information från arrangörerna</ThemedText>

                    {news.map((newsItem) => (
                        <View key={newsItem.title}>
                            <ThemedText type='subtitle'>{filterHtml(newsItem.title ?? "")}</ThemedText>
                            <ThemedText>
                                {new Date(newsItem.date ?? "").toLocaleDateString()}{' '}
                                {new Date(newsItem.date ?? "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </ThemedText>
                            <ThemedText>{filterHtml(newsItem.description)}</ThemedText>
                            {extractLinks(newsItem.description)?.map((link, index) => (
                                <ThemedText key={index} type='link' onPress={() => Linking.openURL(link.url)}>{link.name}</ThemedText>
                            ))}
                        </View>
                    ))}
                </View>
            )}
        </>
    );
};

export default SiteNews;