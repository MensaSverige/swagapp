import {useCallback, useEffect, useState} from 'react';
import useStore from '../../common/store/store';
import {getUserLocations} from '../services/locationService';

// const useGetUsersShowingLocation = () => {
//   const {locationUpdateInterval, setUsersShowingLocation} = useStore();

//   useEffect(() => {
//     getUserLocations().then(users => {
//       setUsersShowingLocation(users);
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       getUserLocations().then(users => {
//         setUsersShowingLocation(users);
//       });
//     }, locationUpdateInterval);

//     // Clear the interval when the component is unmounted
//     return () => clearInterval(intervalId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);
// };
// export default useGetUsersShowingLocation;

const useGetUsersShowingLocation = () => {
  const { locationUpdateInterval, setUsersShowingLocation } = useStore();
  const [isPolling, setIsPolling] = useState(true);

  const fetchUserLocations = useCallback(async () => {
    const users = await getUserLocations();
    setUsersShowingLocation(users);
    if (isPolling) {
      setTimeout(fetchUserLocations, locationUpdateInterval);
    }
  }, [isPolling, locationUpdateInterval]);

  useEffect(() => {
    fetchUserLocations();
    return () => setIsPolling(false); // Stop polling when the component is unmounted
  }, [fetchUserLocations]);

  return { isPolling, setIsPolling };
};

export default useGetUsersShowingLocation;
