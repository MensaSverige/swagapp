import React from 'react';
import {Callout, Marker} from 'react-native-maps';
import EventWithLocation from '../../../events/types/eventWithLocation';
import EventCard from '../../../events/components/EventCard';
import {StyleSheet, Dimensions, View, Text} from 'react-native';
import TimeLeft from '../../../events/utilities/TimeLeft';
import { clockForTime } from '../../functions/clockForTime';
import {ICustomTheme, useTheme} from 'native-base';

const screenWidth = Dimensions.get('window').width;
const calloutWidth = screenWidth * 0.8; // 80% of screen width

const getStyles = (theme: ICustomTheme) =>
  StyleSheet.create({
    callout: {
      width: calloutWidth,
    },
    timePill: {
      position: 'absolute',
      left: 30,
      backgroundColor: theme.colors.background[50],
      padding: 3,
      paddingHorizontal: 10,
      borderRadius: 10,
      elevation: 3,
      alignItems: 'center',
    },
    titlePill: {
      position: 'absolute',
      right: 30,
      backgroundColor: theme.colors.background[50],
      padding: 6,
      paddingHorizontal: 10,
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
      backgroundColor: theme.colors.background[50],
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 30,
      elevation: 3,
      margin: -5,
    },
  });

const EventMarker: React.FC<{
  event: EventWithLocation;
  hasCallout?: boolean;
}> = ({event, hasCallout}) => {
  const theme = useTheme() as ICustomTheme;
  const styles = getStyles(theme);
  return (
    <Marker
      coordinate={event.location}
      anchor={{x: 0.5, y: 0.5}}
      pointerEvents={hasCallout ? 'auto' : 'none'}>
      <View style={styles.markerView}>
        <View style={styles.titlePill}>
          <Text style={{color: theme.colors.text[50]}}>{event.name}</Text>
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
      {hasCallout === true && (
        <Callout tooltip style={styles.callout}>
          <EventCard event={event} initiallyOpen />
        </Callout>
      )}
    </Marker>
  );
};

export default EventMarker;
