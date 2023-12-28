import {Center, ICustomTheme, ScrollView, Text, useTheme} from 'native-base';
import React from 'react';
import {RefreshControl, TouchableOpacity} from 'react-native';
import {UIManager, Platform} from 'react-native';
import {useEventsController} from '../../services/eventsController';
import EventCard from '../cards/EventCard';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CreateEventButton: React.FC = () => {
  const theme = useTheme() as ICustomTheme;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const showEditEventForm = () => {
    navigation.navigate('EventForm', {event: null});
  };

  return (
    <TouchableOpacity onPress={showEditEventForm} style={{padding: 20}}>
      <FontAwesomeIcon icon={faPlus} color={theme.colors.accent[500]} />
    </TouchableOpacity>
  );
};

const Events: React.FC = () => {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <CreateEventButton />,
    });
  }, [navigation]);

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
        {visibleEvents.map(event => (
          <EventCard key={`event-${event.id}`} event={event} />
        ))}
      </ScrollView>
    </Center>
  );
};

export default Events;
