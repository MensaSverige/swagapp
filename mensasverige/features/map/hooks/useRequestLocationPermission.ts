import {useEffect} from 'react';
import useStore from '../../common/store/store';
import {requestLocationPermission} from '../functions/requestLocationPermission';

const useRequestLocationPermission = () => {
  const {hasLocationPermission, setHasLocationPermission} = useStore();
  
  useEffect(() => {
    if (!hasLocationPermission) {
      requestLocationPermission().then(hasPermission => {
        if (hasPermission && !hasLocationPermission) {
          setHasLocationPermission(true);
        } else if (!hasPermission && hasLocationPermission) {
          setHasLocationPermission(false);
        }
      });
      return;
    }
  }, [hasLocationPermission]);
};

export default useRequestLocationPermission;