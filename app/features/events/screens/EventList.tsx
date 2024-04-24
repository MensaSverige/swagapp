import React from 'react';
import { RefreshControl, TouchableOpacity } from 'react-native';
import { UIManager, Platform } from 'react-native';
import { useEventLists } from '../hooks/useEventLists';
import EventCard from '../components/EventCard';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootStackParamList';
import { Button, Center, HStack, View, VStack, ScrollView, Text, ButtonText } from '../../../gluestack-components';
import { config } from '../../../gluestack-components/gluestack-ui.config';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CreateEventButton: React.FC = () => {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const showEditEventForm = () => {
    navigation.navigate('EventForm', { event: null });
  };

  return (

    <Button
      size="md"
      variant="solid"
      action="secondary"
      isDisabled={false}
      isFocusVisible={false}
      onPress={showEditEventForm}>
      <ButtonText style={{ textAlign: 'center' }}>Skapa event</ButtonText>
    </Button>

  );
};

const EventList: React.FC = () => {
  const navigation = useNavigation();

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
    <VStack flex={1} bg="$background50">

      <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}

        refreshControl={
          <RefreshControl
            refreshing={eventsRefreshing}
            onRefresh={fetchAllEvents}
          />
        }>

        {visibleEvents.length === 0 && (
          <Center w="100%" p={10}>
            <Text>Inga spontana event hittades</Text>
          </Center>
        )}
        {visibleEvents.map((event, i) => (
          <EventCard key={`event-${event.id}=${i}`} event={event} />
        ))}
      </ScrollView>
      <CreateEventButton />
    </VStack>
  );
};

export default EventList;
