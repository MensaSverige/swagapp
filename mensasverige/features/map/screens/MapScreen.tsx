import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import ReactNativeMapView from 'react-native-maps';
import UserMarker from '../components/markers/UserMarker';
import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import lightMapstyle from '../styles/light';
import darkMapstyle from '../styles/dark';
import ContactCard from '../components/ContactCard';
import UserWithLocation from '../types/userWithLocation';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import IncognitoInfo from '../components/IncognitoInfo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { UserListPanel } from '../components/UserListPanel';
import { defaultFilter } from '../store/LocationSlice';

const ZOOM_DELTA = 0.005;

const createStyles = (colorMode: string) =>
  StyleSheet.create({
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
  const { region, filteredUsers, selectedUser, setSelectedUser, user, userFilter } = useStore();
  const [visibleRegion, setVisibleRegion] = useState(region);
  const [showContactCard, setShowContactCard] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const hasPerformedInitialZoom = useRef(false);
  const isFocused = useIsFocused();
  const mapOpacity = useRef(new Animated.Value(0)).current;

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
  }, []);

  const focusOnUser = (user: UserWithLocation) => {
    setSelectedUser(user);
    setShowContactCard(true);
    setFollowsUserLocation(false);

    if (user.location) {
      mapRef.current?.animateToRegion(
        {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          latitudeDelta: visibleRegion.latitudeDelta,
          longitudeDelta: visibleRegion.longitudeDelta,
        },
        350,
      );
    }
  };

  const zoomToUser = (user: UserWithLocation) => {
    if (user.location) {
      mapRef.current?.animateToRegion(
        {
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          latitudeDelta: ZOOM_DELTA,
          longitudeDelta: ZOOM_DELTA,
        },
        350,
      );
    }
  };

  const handleFollowLocationPress = async () => {
    const newFollowState = !followsUserLocation;
    setFollowsUserLocation(newFollowState);

    if (newFollowState && user?.location) {
      const { latitude, longitude } = user.location;
      if (latitude && longitude) {
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          },
          350,
        );
      }
    }
  };

  const resetSelectedUser = useMemo(() => () => {
    if (followsUserLocation !== false) {
      setFollowsUserLocation(false);
    }
    if (selectedUser !== null) {
      setSelectedUser(null);
    }
    setShowContactCard(false);
  }, [followsUserLocation, selectedUser]);

  const zoomToFitAllUsers = useMemo(() => (users: typeof filteredUsers) => {
    if (!users || users.length === 0) {
      return;
    }

    resetSelectedUser();
    setShowContactCard(false);

    const latitudes = users.map(user => user.location.latitude);
    const longitudes = users.map(user => user.location.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLong = Math.min(...longitudes);
    const maxLong = Math.max(...longitudes);

    const midLat = (minLat + maxLat) / 2;
    const midLong = (minLong + maxLong) / 2;

    const deltaLat = Math.max((maxLat - minLat) * 1.2, ZOOM_DELTA);
    const deltaLong = Math.max((maxLong - minLong) * 1.2, ZOOM_DELTA);

    mapRef.current?.animateToRegion({
      latitude: midLat,
      longitude: midLong,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLong,
    });
  }, [resetSelectedUser]);

  useEffect(() => {
    if (isFocused) {
      Animated.timing(mapOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      mapOpacity.setValue(0);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!filteredUsers || filteredUsers.length === 0 || hasPerformedInitialZoom.current) {
      return;
    }
    hasPerformedInitialZoom.current = true;
    zoomToFitAllUsers(filteredUsers);
  }, [filteredUsers, zoomToFitAllUsers]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {selectedUser && showContactCard &&
              <ContactCard
                key={`${selectedUser.userId}-${colorMode}`}
                user={selectedUser}
                showCard={showContactCard}
                onClose={onClose}
                onZoom={() => zoomToUser(selectedUser)} />}

            <UserListPanel
              visible={showUserList}
              onClose={() => setShowUserList(false)}
              onFilterApplied={() => zoomToFitAllUsers(filteredUsers)}
              onUserPress={(u) => {
                setShowUserList(false);
                focusOnUser(u);
              }}
            />

            {isFocused && (
              <Animated.View style={{ flex: 1, opacity: mapOpacity }}>
              <ReactNativeMapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={
                  user?.location
                    ? {
                      latitude: user.location.latitude,
                      longitude: user.location.longitude,
                      latitudeDelta: visibleRegion.latitudeDelta,
                      longitudeDelta: visibleRegion.longitudeDelta,
                    }
                    : visibleRegion
                }
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
                {filteredUsers &&
                  filteredUsers.map((u) => (
                    <UserMarker
                      key={u.userId}
                      user={u}
                      zIndex={100}
                      highlighted={selectedUser?.userId === u.userId}
                      onPress={(e) => {
                        e.stopPropagation();
                        focusOnUser(u);
                      }}
                    />
                  ))
                }
              </ReactNativeMapView>
              <View style={styles.mapControlsWrapper}>
                <TouchableOpacity
                  style={styles.mapControlsButton}
                  onPress={() => setShowUserList(true)}>
                  <MaterialIcons
                    name="filter-list"
                    size={30}
                    color={(showUserList || userFilter.showHoursAgo !== defaultFilter.showHoursAgo) ? Colors.primary300 : Colors.coolGray400}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapControlsButton}
                  onPress={handleFollowLocationPress}>
                  <MaterialIcons
                    name="my-location"
                    size={30}
                    color={followsUserLocation
                      ? Colors.primary300
                      : Colors.coolGray400}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapControlsButton}
                  onPress={() => zoomToFitAllUsers(filteredUsers)}>
                  <MaterialIcons
                    name="zoom-out-map"
                    size={30}
                    color={Colors.coolGray400}
                  />
                </TouchableOpacity>
              </View>
              </Animated.View>
            )}
            <IncognitoInfo />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default MapScreen;
