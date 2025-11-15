import {useCallback, useEffect, useState} from 'react';
import useStore from '../../common/store/store';
import {getUserLocations} from '../services/locationService';

const useGetUsersShowingLocation = () => {
  const { user, getLocationUpdateInterval, setUsersShowingLocation } = useStore();
  const [isPolling, setIsPolling] = useState(true);

  const fetchUserLocations = useCallback(async () => {
    try {
      const users = await getUserLocations();
      setUsersShowingLocation(users);
      if (isPolling && user) { // Check user again in case they logged out during the call
        const locationUpdateInterval = getLocationUpdateInterval();
        setTimeout(fetchUserLocations, locationUpdateInterval);
      }
    } catch (error) {
      console.error('Error fetching user locations:', error);
      // Stop polling on error to avoid continuous failed requests
      setIsPolling(false);
    }
  }, [isPolling, getLocationUpdateInterval, user]);

  useEffect(() => {
    // Only start polling if user is logged in
    if (user) {
      fetchUserLocations();
    } else {
      // Clear users when logged out
      setUsersShowingLocation([]);
      setIsPolling(false);
    }
    return () => setIsPolling(false); // Stop polling when the component is unmounted
  }, [fetchUserLocations, user]);

  return { isPolling, setIsPolling };
};

export default useGetUsersShowingLocation;
