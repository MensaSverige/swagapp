import React, {useEffect, useRef} from 'react';
import {
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ReactNativeMapView from 'react-native-maps';
import {
  Box,
  Button,
  Center,
  ITheme,
  Image,
  Text,
  View,
  useTheme,
} from 'native-base';
import UserMarker from '../components/markers/UserMarker';
import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import lightMapstyle from '../styles/light';
import darkMapstyle from '../styles/dark';
import {faUser, faLocation} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import TimeLeft from '../../events/utilities/TimeLeft';

const createStyles = (theme: ITheme) =>
  StyleSheet.create({
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
      shadowOffset: {width: 3, height: 3},
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
      shadowOffset: {width: 3, height: 3},
      shadowOpacity: 0.5,
      shadowRadius: 5,
    },
    infoImage: {
      borderRadius: 3,
      width: 80,
      height: 100,
    },
    infoTextWrapper: {
      flex: 1,
      alignContent: 'flex-start',
      height: '100%',
      paddingHorizontal: 10,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text[500],
    },
    infoContactButton: {
      padding: 3,
    },
  });

const MapView: React.FC = () => {
  const theme = useTheme();
  const mapRef = useRef<ReactNativeMapView | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const {region, usersShowingLocation} = useStore();
  const [mapIndex, setMapIndex] = React.useState(0);
  const [comparisonDate, setComparisonDate] = React.useState(new Date());
  const [followsUserLocation, setFollowsUserLocation] = React.useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setComparisonDate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const screenWidth = Dimensions.get('window').width;

  const styles = createStyles(theme);

  useRequestLocationPermission();
  useGetUsersShowingLocation();

  const focusOnUserAtIndex = (index: number) => {
    if (!usersShowingLocation || usersShowingLocation.length <= index) {
      return;
    }
    setMapIndex(index);
    setFollowsUserLocation(false);
    const {latitude, longitude} = usersShowingLocation[index].location;
    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      },
      350,
    );
    const x =
      mapIndex * (styles.infoCard.width + 10) -
      (screenWidth - styles.infoCard.width) / 2; // Calculate the x position
    scrollViewRef.current?.scrollTo({x, animated: true});
  };

  const scrollViewStyle = {
    ...styles.infoScrollViewContent,
    paddingHorizontal: Platform.OS === 'android' ? 10 : 0,
  };

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
          onPanDrag={() => {
            setFollowsUserLocation(false);
          }}
          mapPadding={{
            top: 10,
            right: 10,
            bottom:
              styles.infoImage.height +
              styles.infoCard.padding * 2 +
              styles.infoScrollViewContent.padding,
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
                key={`user-marker-${u.username}-${(
                  usersShowingLocation[mapIndex].username === u.username
                ).toString()}`}
                user={u}
                zIndex={100}
                highlighted={
                  usersShowingLocation[mapIndex].username === u.username
                }
                onPress={() => {
                  focusOnUserAtIndex(usersShowingLocation.indexOf(u));
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
                  key={`user-card-${u.username}`}
                  onPress={() => {
                    focusOnUserAtIndex(usersShowingLocation.indexOf(u));
                  }}
                  style={styles.infoCard}>
                  {u.avatar_url ? (
                    <Image
                      alt={`Bild på ${u.name}`}
                      source={{uri: u.avatar_url}}
                      style={styles.infoImage}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUser}
                      size={Math.min(
                        styles.infoImage.width,
                        styles.infoImage.height,
                      )}
                      color={theme.colors.secondary[500]}
                    />
                  )}
                  <Box style={styles.infoTextWrapper}>
                    <Text style={styles.infoTitle}>{u.name}</Text>
                    {u.location?.timestamp && (
                      <TimeLeft
                        comparedTo={comparisonDate}
                        start={u.location.timestamp}
                      />
                    )}
                    {u.show_contact_info && (
                      <ContactButton
                        contactInfo={u.contact_info}
                        style={styles.infoContactButton}
                      />
                    )}
                  </Box>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </Box>
    </Center>
  );
};

const ContactButton: React.FC<{
  contactInfo: string | undefined;
  style: any;
}> = ({contactInfo, style}) => {
  if (!contactInfo || contactInfo.trim() === '') {
    return null;
  }

  let type = '';
  if (contactInfo.replace('-', '').match(/^[0-9]*$/)) {
    type = 'phone';
  } else if (
    contactInfo.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
  ) {
    type = 'email';
  } else {
    return <Text>{contactInfo}</Text>;
  }
  return (
    <Button
      size="xs"
      style={style}
      onPress={() => {
        if (type === 'phone') {
          Linking.openURL(`tel:${contactInfo}`);
        } else if (type === 'email') {
          Linking.openURL(`mailto:${contactInfo}`);
        }
      }}>
      {contactInfo}
    </Button>
  );
};

export default MapView;
