import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fetchExternalEvents } from '../services/eventService';

export const ExternalEvents = () => {
  const [events, setEvents] = useState([]);

    useEffect(() => {
        fetchExternalEvents().then((events: any) => {
            setEvents(events);
        });
    }, []);

  return (
    <View>
      <Text>ExternalEvents Component</Text>
    </View>
  );
};

export default ExternalEvents;