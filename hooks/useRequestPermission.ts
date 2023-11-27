import {useEffect} from 'react';
import useStore from '../store/store';
import {requestLocationPermission} from '../functions/requestPermission';

const useRequstLocationPermission = () => {
  const {hasLocationPermission, setHasLocationPermission} = useStore();
  useEffect(() => {
    if (!hasLocationPermission) {
      requestLocationPermission().then(hasPermission => {
        if (hasPermission) {
          setHasLocationPermission(true);
        }
      });
      return;
    }
  }, []);
};
export default useRequstLocationPermission;
