import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Image,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import ReactNativeMapView, {PROVIDER_GOOGLE } from 'react-native-maps';
import UserMarker from '../components/markers/UserMarker';
import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import lightMapstyle from '../styles/light';
import darkMapstyle from '../styles/dark';
import ContactCard from '../components/ContactCard';
import { getFullUrl } from '../../common/functions/GetFullUrl';
import UserWithLocation from '../types/userWithLocation';
import { useFocusEffect } from '@react-navigation/native';
import { FilterMarkersComponent } from '../components/FilterMarkers';
import IncognitoInfo from '../components/IncognitoInfo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const createStyles = (colorMode: string) =>
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
      backgroundColor: colorMode === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 10,
      shadowColor: 'black',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const MapScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme ?? 'light';
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

  }, [filteredUsers]);
  useFocusEffect(
    React.useCallback(() => {
      const onUnfocus = () => {
        setShowContactCard(false);
      };

      return onUnfocus;
    }, [])
  );
  const [followsUserLocation, setFollowsUserLocation] = React.useState(true);

  const styles = createStyles(colorMode);

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
  }, [userFilter]);

  return (
    <SafeAreaView style={{ flex: 1 }} key={colorMode}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
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
              provider={PROVIDER_GOOGLE}
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
                      user={u}
                      zIndex={100}
                      highlighted={selectedUser?.userId === u.userId}
                      onPress={(e) => {
                        e.stopPropagation();
                        focusOnUser(u);
                      }} />
                  ))}
            </ReactNativeMapView>
            <View style={styles.mapControlsWrapper}>
              <TouchableOpacity
                style={styles.mapControlsButton}
                onPress={openFilter}>
                <MaterialIcons
                  name="filter-list"
                  size={30}
                  color={userFilter && (userFilter.name || userFilter.showHoursAgo !== 24) ? Colors.primary300 : Colors.coolGray400}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapControlsButton}
                onPress={() => {
                  setFollowsUserLocation(!followsUserLocation);
                }}>
                <MaterialIcons
                  name="my-location"
                  size={30}
                  color={followsUserLocation
                    ? Colors.primary300
                    : Colors.coolGray400}
                />
              </TouchableOpacity>
            </View>
            <IncognitoInfo />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MapScreen;
