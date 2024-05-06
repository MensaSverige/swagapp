import React from 'react';
import { RefreshControl } from 'react-native';
import { UIManager, Platform } from 'react-native';
import { useEventLists } from '../hooks/useEventLists';
import EventCard from '../components/EventCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/RootStackParamList';
import { Button, Center, VStack, ScrollView, Text, ButtonText, Box, HStack } from '../../../gluestack-components';
import { FutureUserEvent, isFutureUserEvent } from '../types/futureUserEvent';
import { config } from '../../../gluestack-components/gluestack-ui.config';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EventList: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
    <VStack flex={1} bg="$background50" padding={10}>
      <ScrollView
        flex={1}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'flex-start',
        }}
        refreshControl={
          <RefreshControl
            refreshing={eventsRefreshing}
            onRefresh={fetchAllEvents}
            tintColor={config.tokens.colors.secondary300}
            colors={[config.tokens.colors.secondary300]}
          />
        }>
        {visibleEvents.length === 0 && !eventsRefreshing && (
          <Center w="100%" p={10}>
            <Text>Inga spontana event hittades</Text>
          </Center>
        )}
        {visibleEvents.map((event, i) => (
          <Box key={event.id} style={{
            paddingBottom: 10,
          }}
          >
            <EventCard
              key={`event-${event.id}=${i}`}
              event={event}
              onEditEvent={(e: FutureUserEvent) => {
                if (isFutureUserEvent(e)) {
                  navigation.navigate('EventForm', { event: e });
                } else {
                  console.error('Event is not of type FutureUserEvent');
                }
              }}
            />
          </Box>
        ))}
      </ScrollView>
      <HStack space="lg" justifyContent="space-evenly" alignItems='center' paddingVertical={10} >
        <Button
          size="md"
          variant="solid"
          action="secondary"
          width="100%"
          isDisabled={false}
          isFocusVisible={false}
          onPress={() => navigation.navigate('EventForm', { event: null })}>
          <ButtonText style={{ textAlign: 'center' }}>Skapa event</ButtonText>
        </Button>
      </HStack>

    </VStack>
  );
};

export default EventList;
