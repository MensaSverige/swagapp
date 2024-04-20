import React, { useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ReactNativeMapView, { PanDragEvent } from 'react-native-maps';
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
    infoWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    infoScrollView: {
      backgroundColor: 'transparent',
    },
    infoScrollViewContent: {
      backgroundColor: 'transparent',
      padding: 10,
      gap: 10,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background[500],
      width: 330,
      padding: 10,
      borderRadius: 10,
      shadowColor: 'black',
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 5,
    },
  });

const MapView: React.FC = () => {
  const theme = useTheme();
  const mapRef = useRef<ReactNativeMapView | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { region, usersShowingLocation, selectedUserId, setSelectedUserId } = useStore();
  const [focusedContactCard, setFocusedContactCard] = React.useState(usersShowingLocation.findIndex(u => u.userId === selectedUserId));
  useEffect(() => {
    console.log('Map re-rendered');
  });

  const selectedUserKey = useMemo(() => {
    if (selectedUserId) {
      return `user-marker-${selectedUserId}-${Math.random()}`;
    }
    return '';
  }, [selectedUserId]);

  const [followsUserLocation, setFollowsUserLocation] = React.useState(true);

  const screenWidth = Dimensions.get('window').width;

  const styles = createStyles(theme);

  useRequestLocationPermission();
  useGetUsersShowingLocation();

  const focusOnUser = (userId: number) => {
    if (!usersShowingLocation) {
      return;
    }
    setFollowsUserLocation(false)
    const loc = usersShowingLocation.find(u => u.userId === userId)?.location;
    const index = usersShowingLocation.findIndex(u => u.userId === userId);
    setFocusedContactCard(index);
    if (loc) {
      mapRef.current?.animateToRegion(
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        350,
      );
    }
    setSelectedUserId(userId);
    const x =
      index * (styles.infoCard.width + 10) -
      (screenWidth - styles.infoCard.width) / 2; // Calculate the x position
    scrollViewRef.current?.scrollTo({ x, animated: true });
  }

  const scrollViewStyle = {
    ...styles.infoScrollViewContent,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 0,
  };

  function onPanDrag(event: PanDragEvent): void {
    if (followsUserLocation !== false) {
      setFollowsUserLocation(false);
    }
    if (selectedUserId !== null) {
      setSelectedUserId(null);
    }
  }

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
          onPanDrag={onPanDrag}
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
          {usersShowingLocation &&
            usersShowingLocation.map(u => (
              <UserMarker
                key={u.userId === selectedUserId ? selectedUserKey : `user-marker-${u.userId}`}
                user={u}
                zIndex={100}
                highlighted={selectedUserId === u.userId}
                onPress={() => {
                  focusOnUser(u.userId);
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
        <View style={styles.infoWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={1}
            showsHorizontalScrollIndicator={true}
            snapToInterval={styles.infoCard.width + 10}
            snapToAlignment={'center'}
            contentInset={{
              top: 0,
              left: 10,
              bottom: 0,
              right: 10,
            }}
            style={styles.infoScrollView}
            contentContainerStyle={scrollViewStyle}>
            {usersShowingLocation &&
              usersShowingLocation.map(u => (
                <TouchableOpacity
                  activeOpacity={1}
                  key={`user-card-${u.userId}`}
                  onPress={() => {
                    focusOnUser(u.userId);
                  }}
                  style={styles.infoCard}>
                      <ContactCard
                        user={u}
                        isSelected={selectedUserId === u.userId}
                      />

                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Box>
    </Center>
  );
};

export default MapView;
