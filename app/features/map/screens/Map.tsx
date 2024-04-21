import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
} from 'react-native';
import ReactNativeMapView from 'react-native-maps';
import {
  Box,
  Button,
  Center,
  ITheme,
  View,
  useTheme,
} from 'native-base';
import UserMarker from '../components/markers/UserMarker';
import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import lightMapstyle from '../styles/light';
import darkMapstyle from '../styles/dark';
import { faLocation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import ContactCard from '../components/ContactCard';
import { getFullUrl } from '../../common/functions/GetFullUrl';
import UserWithLocation from '../types/userWithLocation';

const createStyles = (theme: ITheme) =>
  StyleSheet.create({
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    mapControlsWrapper: {
      position: 'absolute',
      alignItems: 'flex-end',
      top: 10,
      right: 10,
      left: 10,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    mapControlsButton: {
      backgroundColor: `${theme.colors.background[500]}99`,
      borderRadius: 10,
      shadowColor: 'black',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
  });

const MapView: React.FC = () => {
  const theme = useTheme();
  const mapRef = useRef<ReactNativeMapView | null>(null);
  const { region, usersShowingLocation, selectedUser, setSelectedUser } = useStore();
  const [visibleRegion, setVisibleRegion] = useState(region);
  const [showContactCard, setShowContactCard] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);

  // Prefetch images so they are ready to be displayed
  useEffect(() => {
    console.log('Loading images');
    setIsImagesLoaded(false);

    const loadImages = usersShowingLocation.map(user => {
      if (user.avatar_url) {
        return Image.prefetch(getFullUrl(user.avatar_url));
      }
      return Promise.resolve();
    });

    Promise.all(loadImages)
      .then(() => {
        setIsImagesLoaded(true);
        console.log('Images loaded');
      })
      .catch((error) => console.log("Failed to load images", error));

  }, []);

  const [followsUserLocation, setFollowsUserLocation] = React.useState(true);

  const styles = createStyles(theme);

  useRequestLocationPermission();
  useGetUsersShowingLocation();

  const onClose = useMemo(() => () => {
    setShowContactCard(false);
    setSelectedUser(null);
  }, [selectedUser, showContactCard]);

  const focusOnUser = (user: UserWithLocation) => {
    setSelectedUser(user);
    setShowContactCard(true);
    if (!usersShowingLocation) {
      return;
    }
    setFollowsUserLocation(false)
    if (user.location) {
      mapRef.current?.animateToRegion(
        {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        350,
      );
    }
  }

  const resetSelectedUser = useMemo(() => () => {
    if (followsUserLocation !== false) {
      setFollowsUserLocation(false);
    }
    if (selectedUser !== null) {
      setSelectedUser(null);
    }
  }, [followsUserLocation, selectedUser]);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} w="100%" mx="auto">
        <ReactNativeMapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={region}
          followsUserLocation={followsUserLocation}
          showsMyLocationButton={false}
          onUserLocationChange={e => {
            if (e.nativeEvent.coordinate && followsUserLocation) {
              mapRef.current?.animateToRegion(
                {
                  latitude: e.nativeEvent.coordinate?.latitude,
                  longitude: e.nativeEvent.coordinate?.longitude,
                  latitudeDelta: region.latitudeDelta,
                  longitudeDelta: region.longitudeDelta,
                },
                350,
              );
            }
          }}
          onRegionChangeComplete={setVisibleRegion}
          onPanDrag={resetSelectedUser}
          onPress={resetSelectedUser}
          mapPadding={{
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          }}
          customMapStyle={
            theme.config.initialColorMode === 'dark'
              ? darkMapstyle
              : lightMapstyle
          }>
          {usersShowingLocation && isImagesLoaded &&
            usersShowingLocation
              .filter(u =>
                u.location.latitude >= visibleRegion.latitude - visibleRegion.latitudeDelta * 5 &&
                u.location.latitude <= visibleRegion.latitude + visibleRegion.latitudeDelta * 5 &&
                u.location.longitude >= visibleRegion.longitude - visibleRegion.longitudeDelta * 5 &&
                u.location.longitude <= visibleRegion.longitude + visibleRegion.longitudeDelta * 5
              )
              .map(u => (
                <UserMarker
                  key={u.userId}
                  imageLoaded={isImagesLoaded}
                  user={u}
                  zIndex={100}
                  highlighted={selectedUser?.userId === u.userId}
                  onPress={() => {
                    focusOnUser(u);
                  }}
                />
              ))}
        </ReactNativeMapView>
        <View style={styles.mapControlsWrapper}>
          <Button
            style={styles.mapControlsButton}
            variant="solid"
            onPress={() => {
              setFollowsUserLocation(!followsUserLocation);
            }}>
            <FontAwesomeIcon
              icon={faLocation}
              size={30}
              color={
                followsUserLocation
                  ? theme.colors.primary[500]
                  : theme.colors.secondary[100]
              }
            />
          </Button>
        </View>
      </Box>
      {selectedUser && showContactCard &&
        <ContactCard
          key={selectedUser.userId}
          user={selectedUser}
          showCard={showContactCard}
          onClose={onClose}
        />
      }
    </Center>
  );
};

export default MapView;
