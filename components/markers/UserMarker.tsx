import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {Marker} from 'react-native-maps';
import UserWithLocation from '../types/userWithLocation';

const UserMarker: React.FC<{user: UserWithLocation; zIndex: number}> = ({
  user,
  zIndex,
}) => {
  return (
    <Marker
      coordinate={{
        latitude: user.location.latitude,
        longitude: user.location.longitude,
      }}
      zIndex={zIndex}>
      <View style={styles.marker}>
        <Image source={{uri: user.avatar_url}} style={styles.avatar} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23, // again, half of the width/height
  },
});

export default UserMarker;
