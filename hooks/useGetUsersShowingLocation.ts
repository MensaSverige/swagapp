import {useEffect} from 'react';
import useStore from '../store/store';
import {getUserLocations} from '../services/locationService';

const useGetUsersShowingLocation = () => {
  const {locationUpdateInterval, setUsersShowingLocation} = useStore();

  useEffect(() => {
    getUserLocations().then(users => {
      setUsersShowingLocation(users);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getUserLocations().then(users => {
        setUsersShowingLocation(users);
      });
    }, locationUpdateInterval);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
export default useGetUsersShowingLocation;
