import React from 'react';
import EventWithLocation from '../../types/eventWithLocation';
import {Marker} from 'react-native-maps';
import {ICustomTheme, Text, View, useTheme} from 'native-base';
import {StyleSheet} from 'react-native';
import EventMarker from './EventMarker';
import {clockForTime} from '../../functions/events';
import {getCoordinateDistance} from '../../functions/mapping';
import {EventCluster} from '../../types/EventCluster';

export const clusterMarkerDiameter = 60;
const containedEventSize = clusterMarkerDiameter / 3;

const getStyles = (theme: ICustomTheme) =>
  StyleSheet.create({
    numberView: {
      backgroundColor: theme.colors.background[50],
      padding: 5,
      borderRadius: 30,
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'black',
      shadowOpacity: 0.5,
      shadowRadius: 3,
      shadowOffset: {width: 0, height: 0},
    },
    tightNumberView: {
      width: clusterMarkerDiameter,
      height: clusterMarkerDiameter,
    },
    containedEventsWrapper: {
      position: 'absolute',
      width: clusterMarkerDiameter,
      height: clusterMarkerDiameter,
      alignItems: 'center',
      justifyContent: 'center',
    },
    containedEvent: {
      position: 'absolute',
      width: containedEventSize,
      height: containedEventSize,
      transform: [
        {translateX: clusterMarkerDiameter / 2 - containedEventSize / 2},
        {translateY: clusterMarkerDiameter / 2 - containedEventSize / 2},
      ],
    },
    eventOnBranch: {
      backgroundColor: theme.colors.background[50],
      borderRadius: 10,
      width: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: 'black',
      shadowOpacity: 0.75,
      shadowRadius: 1.5,
      shadowOffset: {width: 0, height: 0},
    },
    numberText: {fontWeight: 'bold'},
  });

function circularOffset(index: number, total: number, radius: number) {
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference / total;
  const angle = (index * arcLength) / radius;
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  return {x, y};
}

const ClusterMarker: React.FC<{
  cluster: EventCluster;
  onPressTightCluster: () => void;
  onPressNormalCluster: () => void;
  zIndex: number;
}> = ({cluster, onPressTightCluster, onPressNormalCluster, zIndex}) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  const tight = cluster.events.every(event => {
    const distance = getCoordinateDistance(
      event.location,
      cluster.centerCoordinate,
    );
    return distance < 5;
  });

  if (cluster.events.length === 1) {
    return <EventMarker event={cluster.events[0]} />;
  }

  const handleOnPress = () => {
    if (tight) {
      console.log('onPressTightCluster');
      onPressTightCluster();
    } else {
      console.log('onPressNormalCluster');
      onPressNormalCluster();
    }
  };

  return (
    <>
      <Marker
        coordinate={cluster.centerCoordinate}
        pinColor="red"
        zIndex={zIndex}
        onCalloutPress={handleOnPress}
        onPress={handleOnPress}>
        <View
          style={[styles.numberView, tight ? styles.tightNumberView : null]}>
          {tight && (
            <View style={styles.containedEventsWrapper} pointerEvents="none">
              {cluster.events.map((event, index) => {
                const {x, y} = circularOffset(
                  index,
                  cluster.events.length,
                  clusterMarkerDiameter / 2 - containedEventSize / 2,
                );
                return (
                  <View
                    key={`contained-event-${event.id}`}
                    style={{...styles.containedEvent, left: x, top: y}}>
                    <Text>
                      {event.location.marker ?? clockForTime(event.start)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <Text style={styles.numberText}>{cluster.events.length}</Text>
        </View>
      </Marker>
      {!tight &&
        cluster.events.map(event => (
          <ClusteredEventMarker
            key={`clustered-event-marker-${event.id}`}
            event={event}
          />
        ))}
    </>
  );
};

const ClusteredEventMarker: React.FC<{event: EventWithLocation}> = ({
  event,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <Marker
      coordinate={event.location}
      zIndex={20}
      tappable={false}
      stopPropagation={false}
      pointerEvents="none">
      <View style={styles.eventOnBranch}>
        <Text fontSize={8}>
          {event.location.marker ?? clockForTime(event.start)}
        </Text>
      </View>
    </Marker>
  );
};

export default ClusterMarker;
