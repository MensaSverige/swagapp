import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import MapView, {Marker, Callout} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {
  AlertDialog,
  Box,
  Button,
  Center,
  Heading,
  Input,
  Text,
  VStack,
} from 'native-base';

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   databaseURL: "YOUR_DATABASE_URL",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID"
// };

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }

// const db = firebase.database().ref('locations');

interface Location {
  latitude: number;
  longitude: number;
}

const UserMap: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [usersLocation, setUsersLocation] = useState<Location[]>([]);

  useEffect(() => {
    Geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords;
      setLocation({latitude, longitude});
      // Update Firebase with the user's location
      //db.push({ latitude, longitude });
    });

    // Subscribe to location updates
    //   db.on('value', snapshot => {
    //     const locations: Location[] = [];
    //     snapshot.forEach(childSnapshot => {
    //       locations.push(childSnapshot.val() as Location);
    //     });
    //     setUsersLocation(locations);
    //   });

    return () => {
      //db.off(); // Unsubscribe on unmount
    };
  }, []);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location ? location.latitude : 59.269249,
            longitude: location ? location.longitude : 15.206333,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          {/* Marker for the main hotel */}
          {location && (
            <Marker
              pinColor="red"
              coordinate={{
                latitude: 59.269249,
                longitude: 15.206333,
              }}
            />
          )}
          {/* Marker for the current user */}
          {location && (
            <Marker coordinate={location} pinColor="blue">
              <Callout>
                <Text>You are here!</Text>
              </Callout>
            </Marker>
          )}
          {/* Marker for other users */}
          {usersLocation.map((userLoc, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: userLoc.latitude,
                longitude: userLoc.longitude,
              }}
            />
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
});

export default UserMap;
