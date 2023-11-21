import React from 'react';
import {Callout, Marker} from 'react-native-maps';
import EventWithLocation from '../types/eventWithLocation';
import EventCard from './EventCard';
import {StyleSheet, Dimensions} from 'react-native';

const screenWidth = Dimensions.get('window').width;
const calloutWidth = screenWidth * 0.8; // 80% of screen width

const styles = StyleSheet.create({
  callout: {
    width: calloutWidth,
  },
});

const EventMarker: React.FC<{
  event: EventWithLocation;
}> = ({event}) => {
  return (
    <Marker
      pinColor="blue"
      coordinate={{
        latitude: event.location.latitude,
        longitude: event.location.longitude,
      }}>
      <Callout tooltip style={styles.callout}>
        <EventCard event={event} open={true} toggleOpen={() => {}} />
      </Callout>
    </Marker>
  );
};

export default EventMarker;
