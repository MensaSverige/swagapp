import {useEffect} from 'react';
import useStore from '../../common/store/store';
import {getUserLocations} from '../services/locationService';

const useGetUsersShowingLocation = () => {
  const user = useStore(state => state.user);
  const getLocationUpdateInterval = useStore(state => state.getLocationUpdateInterval);
  const setUsersShowingLocation = useStore(state => state.setUsersShowingLocation);

  useEffect(() => {
    if (!user) {
      setUsersShowingLocation([]);
      return;
    }

    let active = true;
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3;

    const poll = async () => {
      try {
        const users = await getUserLocations();
        if (active) {
          consecutiveErrors = 0;
          setUsersShowingLocation(users);
        }
      } catch (error) {
        console.error('Error fetching user locations:', error);
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_ERRORS) {
          active = false;
          return;
        }
      }
      if (active) setTimeout(poll, getLocationUpdateInterval());
    };

    poll();

    return () => { active = false; };
  }, [user?.userId,  user?.settings?.show_location, setUsersShowingLocation, getLocationUpdateInterval]);
};

export default useGetUsersShowingLocation;
