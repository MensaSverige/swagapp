import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import MapView, {Marker, Callout} from 'react-native-maps';
import {Box, Center, Text} from 'native-base';
import useStore from '../store';
import useUserLocation from '../hooks/useUserLocation';
import {User} from '../types/user';

const UserMap: React.FC = () => {
  useUserLocation();
  const [usersShowingLocation, setUsersShowingLocation] = useState<User[]>([]);
  const {user, config} = useStore();
  if (!user) {
    return null;
  }

  useEffect(() => {
    //getUserLocations();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      //getUserLocations();
    }, config.locationUpdateInterval);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        {user.location && user.location.latitude && user.location.longitude && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: user.location ? user.location.latitude : 59.269249,
              longitude: user.location ? user.location.longitude : 15.206333,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}>
            {/* Marker for the main hotel */}
            <Marker
              pinColor="red"
              coordinate={{
                latitude: 59.269249,
                longitude: 15.206333,
              }}
            />
            {/* Marker for the current user */}
            {user.location && (
              <Marker
                coordinate={{
                  latitude: user.location.latitude,
                  longitude: user.location.longitude,
                }}
                pinColor="blue">
                <Callout>
                  <Text>You are here!</Text>
                </Callout>
              </Marker>
            )}
            {usersShowingLocation.map(
              (u, index) =>
                u &&
                u.location &&
                u.location.latitude &&
                u.location.longitude && (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: u.location.latitude,
                      longitude: u.location.longitude,
                    }}>
                    {/* Custom view for the marker */}
                    <View
                      style={{
                        width: 50, // specify a size for the image
                        height: 50,
                        borderRadius: 25, // half of width/height to make it circular
                        borderWidth: 2, // optional border
                        borderColor: 'white', // optional border color
                        overflow: 'hidden', // this ensures the image doesn't exceed the border radius
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <Image
                        source={{uri: u.avatar_url}}
                        style={{
                          width: 46, // slightly less than the View to account for the border
                          height: 46,
                          borderRadius: 23, // again, half of the width/height
                        }}
                      />
                    </View>
                  </Marker>
                ),
            )}
          </MapView>
        )}
      </Box>
    </Center>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default UserMap;
