import useStore from '../store/store';
import Geolocation from '@react-native-community/geolocation';
import { useEffect } from 'react';
import { updateUserLocation, LocationUpdateData } from '../services/locationService';


const useUserLocation = () => {
  const {user, config, locationUpdateInterval, setUserLocation, setRegion} = useStore();

  // const checkLocationPermission = async () => {
  //     let permissionStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

  //     if (permissionStatus === RESULTS.DENIED) {
  //         const requestPermission = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  //         return requestPermission === RESULTS.GRANTED;
  //     }

  //     return permissionStatus === RESULTS.GRANTED;
  // };

  useEffect(() => {
      const fetchLocation = async () => {
          // const hasPermission = await checkLocationPermission();

          // if (!hasPermission) {
          //     setError('Location permission denied');
          //     return;
          // }
          Geolocation.getCurrentPosition(
              (position) => {
                const {latitude, longitude} = position.coords;
                
                if(user && user.username != undefined && latitude != undefined && longitude != undefined)  {
                  setUserLocation(latitude, longitude);
                  setRegion({latitude: latitude, longitude: longitude, latitudeDelta: 0.0922, longitudeDelta: 0.0421});
                  if(user.show_location) {
                    const locationUpdateData: LocationUpdateData = { username: user.username, latitude: latitude, longitude: longitude }; 
                    updateUserLocation(locationUpdateData);
                  }
                }
              },
              (e) => {
                  //setError(e.message);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
      };

      fetchLocation();
      setInterval(fetchLocation, locationUpdateInterval);
  }, [setUserLocation]); 

};

export default useUserLocation;