import {Center, ICustomTheme, ScrollView, Text, useTheme} from 'native-base';
import React from 'react';
import {RefreshControl, TouchableOpacity} from 'react-native';
import {UIManager, Platform} from 'react-native';
import {useEventLists} from '../hooks/useEventLists';
import EventCard from '../components/EventCard';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../navigation/RootStackParamList';

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
    <TouchableOpacity onPress={showEditEventForm} style={{paddingRight: 20}}>
      <FontAwesomeIcon icon={faPlus} color={theme.colors.accent[500]} />
    </TouchableOpacity>
  );
};

const EventList: React.FC = () => {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => <CreateEventButton />,
    });
  }, [navigation]);

  const {
    visibleEvents,
    eventsRefreshing,
    fetchAllEvents,
    subscribe,
    unsubscribe,
  } = useEventLists();

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
          <RefreshControl
            refreshing={eventsRefreshing}
            onRefresh={fetchAllEvents}
          />
        }>
        {visibleEvents.length === 0 && (
          <Center w="100%" p={10}>
            <Text>Inga evenemang hittades</Text>
          </Center>
        )}
        {visibleEvents.map((event, i) => (
          <EventCard key={`event-${event.id}=${i}`} event={event} />
        ))}
      </ScrollView>
    </Center>
  );
};

export default EventList;
