import React, {useRef} from 'react';
import {StyleSheet} from 'react-native' ;
import ReactNativeMapView from 'react-native-maps';
import {Box, Center, useTheme} from 'native-base';
import UserMarker from './markers/UserMarker';
import useStore from '../../store/store';
import useRequstLocationPermission from '../../hooks/useRequestPermission';
import useGetUsersShowingLocation from '../../hooks/useGetUsersShowingLocation';

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  refreshIndicatorsWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    alignItems: 'center',
    zIndex: 1,
  },
});

const MapView: React.FC = () => {
  const theme = useTheme();
  const mapRef = useRef<ReactNativeMapView | null>(null);
  const {user, region, usersShowingLocation } = useStore();
 
  useRequstLocationPermission();
  useGetUsersShowingLocation();

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        <ReactNativeMapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={region}
        >
          {usersShowingLocation &&
            usersShowingLocation.map(
              u =>
                u.username != user?.username && (
                  <UserMarker
                    key={`user-${u.username}`}
                    user={u}
                    zIndex={100}
                  />
                ),
            )}
        </ReactNativeMapView>
      </Box>
    </Center>
  );
};

export default MapView;
