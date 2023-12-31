import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {Marker} from 'react-native-maps';
import UserWithLocation from '../../../types/userWithLocation';
import {ICustomTheme, View, useTheme} from 'native-base';
import {faUser} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';

const UserMarker: React.FC<{
  user: UserWithLocation;
  zIndex: number;
  highlighted: boolean;
  onPress: () => void;
}> = ({user, zIndex, highlighted, onPress}) => {
  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);
  return (
    <Marker
      coordinate={{
        latitude: user.location.latitude,
        longitude: user.location.longitude,
      }}
      anchor={{x: 0.5, y: 0.5}}
      zIndex={zIndex}
      onPress={onPress}>
      <View
        style={[styles.marker, ...[highlighted && styles.markerHighlighted]]}>
        {user.avatar_url ? (
          <Image source={{uri: user.avatar_url}} style={styles.avatar} />
        ) : (
          <FontAwesomeIcon
            icon={faUser}
            size={24}
            color={theme.colors.text[500]}
          />
        )}
      </View>
      {/* <Callout>
        <View style={styles.callout}>
          <Heading>{user.name}</Heading>
          {user.avatar_url && (
            <Image
              source={{uri: user.avatar_url}}
              style={styles.callout_avatar}
            />
          )}
        </View>
      </Callout> */}
    </Marker>
  );
};

const createStyles = (theme: ICustomTheme) =>
  StyleSheet.create({
    marker: {
      width: 50,
      height: 50,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.colors.text[500],
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background[500],
    },
    markerHighlighted: {
      width: 90,
      height: 90,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 90, // again, half of the width/height
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
