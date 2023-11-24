import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet} from 'react-native';
import ReactNativeMapView, {Polyline, Region} from 'react-native-maps';
import {Box, Center, Text, useTheme} from 'native-base';
import {useEventsController} from '../services/eventsController';
import UserMarker from './markers/UserMarker';
import ClusterMarker, {clusterMarkerDiameter} from './markers/ClusterMarker';
import {EventCluster} from '../types/EventCluster';
import EventWithLocation from '../types/eventWithLocation';
import {findFarthestEvent, getCoordinateDistance} from '../functions/mapping';
import {getCenterCoordinate} from '../functions/events';
import {useLocationState} from '../store/store';
import {User} from '../types/user';
import {getUserLocations} from '../services/locationService';

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

const MapView: React.FC = () => {
  const theme = useTheme();
  const [manualRegion, setManualRegion] = React.useState<boolean>(false);
  const [eventClusters, setEventClusters] = React.useState<EventCluster[]>([]);
  const [epsilon, setEpsilon] = React.useState<number>(0.01); // Define epsilon based on your coordinate system

  const [usersShowingLocation, setUsersShowingLocation] = useState<User[]>([]);
  const {locationUpdateInterval} = useLocationState();

  useEffect(() => {
    getUserLocations().then(users => {
      setUsersShowingLocation(users);
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getUserLocations().then(users => {
        setUsersShowingLocation(users);
        console.log('helloo', users);
      });
    }, locationUpdateInterval);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  const {
    eventsRefreshing,
    eventsWithLocation: events,
    subscribe: subscribeToEvents,
    unsubscribe: unsubscribeToEvents,
  } = useEventsController();

  const mapRef = useRef<ReactNativeMapView | null>(null);
  const mapRegion = useRef<Region | null>(null);

  const onTouchingMap = () => {
    setManualRegion(true);
  };

  const onMapRegionChangeComplete = (region: Region) => {
    mapRegion.current = region;
    if (mapRef.current) {
      Promise.all([
        mapRef.current.coordinateForPoint({x: 0, y: 0}),
        mapRef.current.coordinateForPoint({x: clusterMarkerDiameter, y: 0}),
      ])
        .then(([coordinateA, coordinateB]) => {
          const distance = getCoordinateDistance(coordinateA, coordinateB); // Using Haversine formula
          setEpsilon(distance);
        })
        .catch(error => {
          console.error('Error getting coordinates:', error);
        });
    }
  };

  const zoomToCluster = (cluster: EventCluster) => {
    setManualRegion(true);
    if (!mapRef.current || !mapRegion.current || cluster.events.length <= 1) {
      return;
    }

    const {farthestEvent, maxDistance} = findFarthestEvent(cluster);
    if (!farthestEvent) {
      return;
    }

    const paddingFactor = 0.75; // Reducing the delta to zoom in

    // Calculate new deltas
    const scale = maxDistance / epsilon;
    const newLatitudeDelta =
      mapRegion.current.latitudeDelta * scale * paddingFactor;
    const newLongitudeDelta =
      mapRegion.current.longitudeDelta * scale * paddingFactor;

    // Calculate center coordinate based on center of min and max instead of average
    const minLat = Math.min(
      ...cluster.events.map(event => event.location.latitude),
    );
    const maxLat = Math.max(
      ...cluster.events.map(event => event.location.latitude),
    );
    const minLng = Math.min(
      ...cluster.events.map(event => event.location.longitude),
    );
    const maxLng = Math.max(
      ...cluster.events.map(event => event.location.longitude),
    );
    const centerCoordinate = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
    };

    // Define new region
    const newRegion = {
      ...centerCoordinate,
      latitudeDelta: newLatitudeDelta,
      longitudeDelta: newLongitudeDelta,
    };

    mapRef.current.animateToRegion(newRegion, 500); // Animate to the new region
  };

  const panToCluster = (cluster: EventCluster) => {
    setManualRegion(true);

    const currentRegion = mapRegion.current;
    if (!currentRegion) {
      return;
    }
    const newRegion: Region = {
      ...currentRegion,
      ...cluster.centerCoordinate,
    };
    console.log('New region:', newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  useEffect(() => {
    subscribeToEvents('map');
    return () => {
      unsubscribeToEvents('map');
    };
  }, [subscribeToEvents, unsubscribeToEvents]);

  useEffect(() => {
    if (
      mapRef.current &&
      !manualRegion &&
      (usersShowingLocation.length > 0 || events.length > 0)
    ) {
      // TODO: Add user location to this so map zooms to include users
      const coordinates = events.map(item => ({
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

    if (events.length > 0) {
      const findNeighbors = (
        event: EventWithLocation,
        otherEvents: EventWithLocation[],
      ) => {
        return otherEvents.filter(
          otherEvent =>
            getCoordinateDistance(event.location, otherEvent.location) <=
            epsilon,
        );
      };

      const expandCluster = (
        cluster: EventCluster,
        allClusters: EventCluster[],
        event: EventWithLocation,
        neighbors: EventWithLocation[],
        visited: Set<EventWithLocation>,
        otherEvents: EventWithLocation[],
        minPts: number,
      ) => {
        cluster.events.push(event);

        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            const neighborNeighbors = findNeighbors(neighbor, otherEvents);
            if (neighborNeighbors.length >= minPts) {
              neighbors = neighbors.concat(neighborNeighbors);
            }
          }

          if (!isEventInClusters(cluster, allClusters, neighbor)) {
            cluster.events.push(neighbor);
          }
        });
      };

      const isEventInClusters = (
        currentCluster: EventCluster,
        allClusters: EventCluster[],
        event: EventWithLocation,
      ) => {
        return allClusters
          .concat([currentCluster])
          .some(cluster => cluster.events.includes(event));
      };

      const clusters: EventCluster[] = [];
      const visited = new Set<EventWithLocation>();
      const minPts = 1;

      events.forEach(event => {
        if (!visited.has(event)) {
          visited.add(event);
          const neighbors = findNeighbors(event, events);

          if (neighbors.length >= minPts) {
            const cluster: EventCluster = {
              events: [],
              centerCoordinate: event.location,
            };
            expandCluster(
              cluster,
              clusters,
              event,
              neighbors,
              visited,
              events,
              minPts,
            );
            clusters.push(cluster);
          }
        }
      });

      // Calculate center coordinate for each cluster
      clusters.forEach(cluster => {
        cluster.centerCoordinate = getCenterCoordinate(cluster.events);
      });

      setEventClusters(clusters);
    }
  }, [usersShowingLocation, events, manualRegion, epsilon]);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        <Box style={styles.refreshIndicatorsWrapper}>
          {eventsRefreshing && <Text>Laddar evenemang...</Text>}
        </Box>
        <ReactNativeMapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          onPanDrag={onTouchingMap}
          onCalloutPress={() => onTouchingMap()}
          onDoublePress={() => onTouchingMap()}
          onRegionChangeComplete={onMapRegionChangeComplete}>
          {usersShowingLocation.map(user => (
            <UserMarker
              key={`user-${user.username}`}
              user={user}
              zIndex={100}
            />
          ))}
          {eventClusters.map((cluster, i) => (
            // This draws the lines between events and a cluster center
            <React.Fragment key={`event-cluster-${i}`}>
              <ClusterMarker
                cluster={cluster}
                zIndex={99}
                onPressNormalCluster={() => zoomToCluster(cluster)}
                onPressTightCluster={() => panToCluster(cluster)}
              />
              {cluster.events.length > 1 &&
                cluster.events.map(event => (
                  <Polyline
                    key={`polyline-to-${event.id}`}
                    coordinates={[event.location, cluster.centerCoordinate]}
                    strokeWidth={2}
                    strokeColor={theme.colors.text[500]}
                    zIndex={10}
                  />
                ))}
            </React.Fragment>
          ))}
        </ReactNativeMapView>
      </Box>
    </Center>
  );
};

export default MapView;
