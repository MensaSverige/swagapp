import React from 'react';
import {Callout, Marker} from 'react-native-maps';
import EventWithLocation from '../../types/eventWithLocation';
import EventCard from '../cards/EventCard';
import {StyleSheet, Dimensions, View, Text} from 'react-native';
import TimeLeft from '../utilities/TimeLeft';
import {clockForTime} from '../../functions/events';

const screenWidth = Dimensions.get('window').width;
const calloutWidth = screenWidth * 0.8; // 80% of screen width

const styles = StyleSheet.create({
  callout: {
    width: calloutWidth,
  },
  timePill: {
    position: 'absolute',
    left: 30,
    backgroundColor: 'white',
    padding: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  titlePill: {
    position: 'absolute',
    right: 30,
    backgroundColor: 'white',
    padding: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  markerView: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // Use row for horizontal layout
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 0},
  },
  markerEmoji: {
    backgroundColor: 'white',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    elevation: 3,
    margin: -5,
  },
});

const EventMarker: React.FC<{event: EventWithLocation}> = ({event}) => {
  return (
    <Marker coordinate={event.location} anchor={{x: 0.5, y: 0.5}}>
      <View style={styles.markerView}>
        <View style={styles.titlePill}>
          <Text>{event.name}</Text>
        </View>
        <View style={styles.markerEmoji}>
          <Text>{event.location.marker ?? clockForTime(event.start)}</Text>
        </View>
        <View style={styles.timePill}>
          <TimeLeft
            comparedTo={new Date()}
            start={event.start}
            end={event.end}
          />
        </View>
      </View>
      <Callout tooltip style={styles.callout}>
        <EventCard event={event} open={true} toggleOpen={() => {}} />
      </Callout>
    </Marker>
  );
};

export default EventMarker;
