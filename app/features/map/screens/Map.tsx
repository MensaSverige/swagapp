import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import ReactNativeMapView from 'react-native-maps';
import {
  Button,
  KeyboardAvoidingView,
  View,
  SafeAreaView,
  VStack
} from '../../../gluestack-components';
import UserMarker from '../components/markers/UserMarker';
import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import lightMapstyle from '../styles/light';
import darkMapstyle from '../styles/dark';
import { faFilter, faLocation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import ContactCard from '../components/ContactCard';
import { getFullUrl } from '../../common/functions/GetFullUrl';
import UserWithLocation from '../types/userWithLocation';
import { useFocusEffect } from '@react-navigation/native';
import { FilterMarkersComponent } from '../components/FilterMarkers';
import IncognitoInfo from '../components/IncognitoInfo';
import { config } from '../../../gluestack-components/gluestack-ui.config';
import { useColorMode } from '@gluestack-ui/themed';


const createStyles = () =>
  StyleSheet.create({
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    mapControlsWrapper: {
      position: 'absolute',
      top: 50,
      right: 10,
      zIndex: 1,
      backgroundColor: 'transparent',
      width: 50,
      flexDirection: 'column',
      gap: 10,
    },
    mapControlsButton: {
      backgroundColor: `$background0`,
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
  const colorMode = useColorMode();
  const mapRef = useRef<ReactNativeMapView | null>(null);
  const { region, usersShowingLocation, filteredUsers, selectedUser, userFilter, setSelectedUser, setFilteredUsers } = useStore();
  const [visibleRegion, setVisibleRegion] = useState(region);
  const [showContactCard, setShowContactCard] = useState(false);
  const [showFilter, setshowFilter] = useState(false);
  const [isImagesLoaded, setIsImagesLoaded] = useState(false);

  // Prefetch images so they are ready to be displayed
  useEffect(() => {
    console.log('Loading images');
    setIsImagesLoaded(false);

    const loadImages = filteredUsers.map(user => {
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

  }, [userFilter]);
  useFocusEffect(
    React.useCallback(() => {
      const onUnfocus = () => {
        setShowContactCard(false);
      };

      return onUnfocus;
    }, [])
  );
  const [followsUserLocation, setFollowsUserLocation] = React.useState(true);

  const styles = createStyles();

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

  const openFilter = () => {
    setShowContactCard(false);
    setSelectedUser(null);
    setshowFilter(true);
  };

  const resetSelectedUser = useMemo(() => () => {
    if (followsUserLocation !== false) {
      setFollowsUserLocation(false);
    }
    if (selectedUser !== null) {
      setSelectedUser(null);
    }
    setShowContactCard(false);
    setshowFilter(false);

  }, [followsUserLocation, selectedUser, showContactCard, showFilter]);

  useEffect(() => {
    if (!filteredUsers || filteredUsers.length === 0) {
      return;
    }
    if (userFilter.name === undefined && userFilter.showHoursAgo === undefined) {
      return;
    }
    resetSelectedUser();
    setShowContactCard(false);

    const latitudes = filteredUsers.map(user => user.location.latitude);
    const longitudes = filteredUsers.map(user => user.location.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLong = Math.min(...longitudes);
    const maxLong = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLong = (minLong + maxLong) / 2;

    const deltaLat = (maxLat - minLat) * 1.2;
    const deltaLong = (maxLong - minLong) * 1.2;

    mapRef.current?.animateToRegion({
      latitude: midLat,
      longitude: midLong,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLong,
    });
  }, [userFilter, isImagesLoaded]);

  return (
    <SafeAreaView flex={1} key={colorMode}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        flex={1}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <VStack flex={1}>
            {selectedUser && showContactCard &&
              <ContactCard
                key={`${selectedUser.userId}-${colorMode}`}
                user={selectedUser}
                showCard={showContactCard}
                onClose={onClose} />}

            <FilterMarkersComponent
              showFilterView={showFilter}
              onClose={
                () => {
                  setshowFilter(false);
                }
              } />

            <ReactNativeMapView
              ref={mapRef}
              style={{ flex: 1 }}
              //style={styles.map}
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
                    350
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
              customMapStyle={colorMode === 'dark'
                ? darkMapstyle
                : lightMapstyle}>
              {filteredUsers && isImagesLoaded &&
                filteredUsers
                  .filter(u => u.location.latitude >= visibleRegion.latitude - visibleRegion.latitudeDelta * 5 &&
                    u.location.latitude <= visibleRegion.latitude + visibleRegion.latitudeDelta * 5 &&
                    u.location.longitude >= visibleRegion.longitude - visibleRegion.longitudeDelta * 5 &&
                    u.location.longitude <= visibleRegion.longitude + visibleRegion.longitudeDelta * 5
                  )
                  .map(u => (
                    <UserMarker
                      key={`${u.userId}-${colorMode}`}
                      imageLoaded={isImagesLoaded}
                      user={u}
                      zIndex={100}
                      highlighted={selectedUser?.userId === u.userId}
                      onPress={() => {
                        focusOnUser(u);
                      }} />
                  ))}
            </ReactNativeMapView>
            <View style={styles.mapControlsWrapper}>
              <Button
                style={styles.mapControlsButton}
                variant="solid"
                onPress={openFilter}>
                <FontAwesomeIcon
                  icon={faFilter}
                  size={30}
                  color={userFilter && (userFilter.name || userFilter.showHoursAgo !== 24) ? config.tokens.colors.primary300 : config.tokens.colors.coolGray400}
                />
              </Button>
              <Button
                style={styles.mapControlsButton}
                variant="solid"
                onPress={() => {
                  setFollowsUserLocation(!followsUserLocation);
                }}>
                <FontAwesomeIcon
                  icon={faLocation}
                  size={30}
                  color={followsUserLocation
                    ? config.tokens.colors.primary300
                    : config.tokens.colors.coolGray400}
                />
              </Button>
            </View>
            <IncognitoInfo />
          </VStack>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MapView;
