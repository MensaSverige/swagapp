import useStore from '../store';
import Geolocation from '@react-native-community/geolocation';
import { useEffect } from 'react';


const useUserLocation = () => {
  const {user, config, setUserLocation} = useStore();

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
                }
              },
              (e) => {
                  //setError(e.message);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
      };

      fetchLocation();
      setInterval(fetchLocation, config.locationUpdateInterval);
  }, [setUserLocation]);

};

export default useUserLocation;
