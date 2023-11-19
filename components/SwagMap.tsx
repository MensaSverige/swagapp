import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Image } from 'react-native';
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
import useStore from '../store';

interface Location {
  latitude: number;
  longitude: number;
}
interface UserLocation {
  name: string;
  avatar_url: string;
  lat: number;
  lng: number;
  profileImage: string;
  //location: Location;
  //todo add timestamp and resolution
}
interface LocationUpdateData {
  username: string;
  lat: number;
  lng: number;
}
function generateFakeUserLocations(numberOfUsers: number) {
  const fakeUsers = [];
  //const avatarBaseURL = 'https://api.adorable.io/avatars/'; // Using a placeholder avatar service

  for (let i = 0; i < numberOfUsers; i++) {
    const fakeUser = {
      name: `User${i + 1}`,
      avatar_url: `https://secure.gravatar.com/avatar/e6bb5f4f4707bfdd1b205e2b2a2dd130?d=https%3A%2F%2Fmedlem.mensa.se%2Fuploads%2Fset_resources_2%2F84c1e40ea0e759e3f1505eb1788ddf3c_default_photo.png`,
      // location: {
      //   // Generate random coordinates for the sake of example. These values should be within reasonable distance from your actual map area.
      //   latitude: 59.2 + Math.random() * 0.1 - 0.05,
      //   longitude: 15.2 + Math.random() * 0.1 - 0.05,
      // },
      lat: 59.269249 + Math.random() * 0.01 - 0.005,
      lng: 15.206333 + Math.random() * 0.01 - 0.005,
      profileImage: `https://secure.gravatar.com/avatar/e6bb5f4f4707bfdd1b205e2b2a2dd130?d=https%3A%2F%2Fmedlem.mensa.se%2Fuploads%2Fset_resources_2%2F84c1e40ea0e759e3f1505eb1788ddf3c_default_photo.png`,
    };
    fakeUsers.push(fakeUser);
  }

  return fakeUsers;
}

const UserMap: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [usersLocation, setUsersLocation] = useState<UserLocation[]>([]);
  const { config, user } = useStore();

  const getUserLocations = async () => {
    const response = await fetch(config.apiUrl + '/users_showing_location');
    const data: UserLocation[]  = await response.json();
    console.log('data', data);
    setUsersLocation(data);
  };

  const getAndUpdateUserLocation = async () => {
    Geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords;
      setLocation({latitude, longitude});

      if(user && user.username != undefined && latitude != undefined && longitude != undefined)  {
        console.log('user', user);
        console.log('latitude', latitude);
        console.log('longitude', longitude);
        updateUserLocation({username: user.username, lat: latitude, lng: longitude});
      // Update with the user's location
      }
    });
  };
  const updateUserLocation = async (data: LocationUpdateData) => {
    try {
      const response = await fetch(config.apiUrl + '/update_user_location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const errorData: string = await response.json();
        throw new Error(errorData || 'An error occurred while updating the location.');
      }
  
      const responseData = await response.json();
      console.log('Location updated successfully:', responseData);
    } catch (error: any) {
      console.error('Error updating location:', error.message || error);
    }
  };

  const getFakeUserLocations = () => {
    const users = generateFakeUserLocations(10);
    setUsersLocation(users);
  };

  useEffect(() => {
    getFakeUserLocations();
    //getUserLocations();
    getAndUpdateUserLocation();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getFakeUserLocations();
      //getUserLocations();
      getAndUpdateUserLocation();
    }, 60000); // 60000 milliseconds = 1 minute

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);

  // useEffect(() => {
    
  //   return () => {
      
  //   };
  // }, []);

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
          {/* {usersLocation.map((userLoc, index) => (
            <Marker pinColor="yellow"
              key={index}
              coordinate={{
                // latitude: userLoc.location.latitude,
                // longitude: userLoc.location.longitude,
                latitude: userLoc.lat,
                longitude: userLoc.lng,
              }}
            />
          ))} */}
          {usersLocation.map((userLoc, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: userLoc.lat,
              longitude: userLoc.lng,
            }}
          >
            {/* Custom view for the marker */}
            <View style={{
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
                source={{ uri: userLoc.profileImage }}
                style={{
                  width: 46, // slightly less than the View to account for the border
                  height: 46,
                  borderRadius: 23, // again, half of the width/height
                }}
              />
            </View>
          </Marker>
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
