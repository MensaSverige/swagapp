import {useEffect} from 'react';
import useStore from '../../common/store/store';
import {requestLocationPermission} from '../functions/requestLocationPermission';

const useRequestLocationPermission = () => {
  const {hasLocationPermission, setHasLocationPermission} = useStore();
  
  useEffect(() => {
    if (!hasLocationPermission) {
      console.log('Requesting location permission');
      requestLocationPermission().then(hasPermission => {
        if (hasPermission && !hasLocationPermission) {
          console.log('Location permission granted');
          setHasLocationPermission(true);
        } else if (!hasPermission && hasLocationPermission) {
          console.log('Location permission denied');
          setHasLocationPermission(false);
        }
      });
      return;
    }
  }, [hasLocationPermission]);
};

export default useRequestLocationPermission;