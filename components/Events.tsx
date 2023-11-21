import {Center, ScrollView, Text} from 'native-base';
import React from 'react';
import {Event} from '../types/event';
import {RefreshControl} from 'react-native';
import {LayoutAnimation, UIManager, Platform} from 'react-native';
import {useEventsController} from '../services/eventsController';
import EventCard from './EventCard';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Events: React.FC = () => {
  const {visibleEvents, eventsRefreshing, fetchData, subscribe, unsubscribe} =
    useEventsController();

  const [openEvents, setOpenEvents] = React.useState<Array<Event>>([]);

  const toggleOpen = (event: Event) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (openEvents.includes(event)) {
      setOpenEvents(openEvents.filter(e => e !== event));
    } else {
      setOpenEvents([...openEvents, event]);
    }
  };
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
          <EventCard
            key={event.id}
            event={event}
            open={openEvents.includes(event)}
            toggleOpen={toggleOpen}
          />
        ))}
      </ScrollView>
    </Center>
  );
};

export default Events;
