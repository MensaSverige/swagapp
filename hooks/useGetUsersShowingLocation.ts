import {useEffect} from 'react';
import useStore from '../store/store';
import {getUserLocations} from '../services/locationService';

const useGetUsersShowingLocation = () => {
const {locationUpdateInterval, setUsersShowingLocation } = useStore();

useEffect(() => {
    getUserLocations().then(users => {
      console.log('usersShowingLocation', users);
      setUsersShowingLocation(users);
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      getUserLocations().then(users => {
        console.log('usersShowingLocation', users);
        setUsersShowingLocation(users);
      });
    }, locationUpdateInterval);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, []);
};
export default useGetUsersShowingLocation;