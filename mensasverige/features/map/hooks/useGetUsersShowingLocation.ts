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

    const poll = async () => {
      try {
        const users = await getUserLocations();
        if (active) setUsersShowingLocation(users);
      } catch (error) {
        console.error('Error fetching user locations:', error);
      }
      if (active) setTimeout(poll, getLocationUpdateInterval());
    };

    poll();

    return () => { active = false; };
  }, [user?.userId, setUsersShowingLocation, getLocationUpdateInterval]);
};

export default useGetUsersShowingLocation;
