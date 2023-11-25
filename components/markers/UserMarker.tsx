import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {Callout, Marker} from 'react-native-maps';
import UserWithLocation from '../../types/userWithLocation';
import {Heading} from 'native-base';

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
      <Callout>
        <View style={styles.callout}>
          <Heading>{user.name}</Heading>
          <Image
            source={{uri: user.avatar_url}}
            style={styles.callout_avatar}
          />
        </View>
      </Callout>
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
  callout: {
    gap: 10,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callout_avatar: {
    width: 196,
    height: 160,
  },
});

export default UserMarker;
