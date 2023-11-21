import React, {useEffect, useRef} from 'react';
import {StyleSheet} from 'react-native';
import MapView from 'react-native-maps';
import {Box, Center, Text} from 'native-base';
import {useEventsController} from '../services/eventsController';
import UserMarker from './UserMarker';
import EventMarker from './EventMarker';
import {useLocationController} from '../services/locationController';

const UserMap: React.FC = () => {
  const [manualRegion, setManualRegion] = React.useState<boolean>(false);

  const {
    usersWithLocation: users,
    subscribe: subscribeToLocations,
    unsubscribe: unsubscribeToLocations,
  } = useLocationController();
  const {
    eventsRefreshing,
    eventsWithLocation: events,
    subscribe: subscribeToEvents,
    unsubscribe: unsubscribeToEvents,
  } = useEventsController();

  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    subscribeToEvents('map');
    subscribeToLocations('map');
    return () => {
      unsubscribeToEvents('map');
      unsubscribeToLocations('map');
    };
  }, [
    subscribeToEvents,
    subscribeToLocations,
    unsubscribeToEvents,
    unsubscribeToLocations,
  ]);

  const onMapRegionChange = () => {
    setManualRegion(true);
  };

  useEffect(() => {
    if (
      mapRef.current &&
      !manualRegion &&
      (users.length > 0 || events.length > 0)
    ) {
      const coordinates = [...users, ...events].map(item => ({
        latitude: item.location.latitude,
        longitude: item.location.longitude,
      }));

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
          animated: true,
        });
      }
    }
  }, [users, events, manualRegion]);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        <Box style={styles.refreshIndicatorsWrapper}>
          {eventsRefreshing && <Text>Loading events...</Text>}
        </Box>
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          onRegionChange={onMapRegionChange}>
          {users.map(user => (
            <UserMarker key={`user-${user.username}`} user={user} />
          ))}
          {events.map(event => (
            <EventMarker key={`event-${event.id}`} event={event} />
          ))}
        </MapView>
      </Box>
    </Center>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  refreshIndicatorsWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    alignItems: 'center',
    zIndex: 1,
  },
});

export default UserMap;
