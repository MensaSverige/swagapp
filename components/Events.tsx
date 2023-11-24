import {Center, ScrollView, Text} from 'native-base';
import React from 'react';
import {Event} from '../types/event';
import {RefreshControl} from 'react-native';
import {UIManager, Platform} from 'react-native';
import {useEventsController} from '../services/eventsController';
import EventCard from './cards/EventCard';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Events: React.FC = () => {
  const {visibleEvents, eventsRefreshing, fetchData, subscribe, unsubscribe} =
    useEventsController();

  React.useEffect(() => {
    subscribe('eventsView');
    return () => {
      unsubscribe('eventsView');
    };
  }, [subscribe, unsubscribe]);

  return (
    <Center w="100%" h="100%">
      <ScrollView
        w="100%"
        h="100%"
        refreshControl={
          <RefreshControl refreshing={eventsRefreshing} onRefresh={fetchData} />
        }>
        {visibleEvents.length === 0 && (
          <Center w="100%" p={10}>
            <Text>Inga evenemang hittades</Text>
          </Center>
        )}
        {visibleEvents.map((event: Event) => (
          <EventCard key={`event-${event.id}`} event={event} />
        ))}
      </ScrollView>
    </Center>
  );
};

export default Events;
