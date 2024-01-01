import useStore from '../../common/store/store';
import {useCallback, useEffect, useRef, useState} from 'react';
import {fetchStaticEvents, fetchUserEvents} from '../services/eventService';

const DATA_STALE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const useEventLists = () => {
  const {
    setUserEvents,
    setStaticEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsRefreshing,
    eventsLastFetched,
    visibleEvents,
    eventsWithLocation,
  } = useStore();

  const [consumers, setConsumers] = useState<string[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (eventsRefreshing) {
      return;
    }

    setEventsRefreshing(true);

    return Promise.all([fetchUserEvents(), fetchStaticEvents()])
      .then(([userEvents, staticEvents]) => {
        setUserEvents(userEvents);
        setStaticEvents(staticEvents);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        const lastFetched = new Date();
        setEventsLastFetched(lastFetched);
        setEventsRefreshing(false);
      });
  }, [
    setUserEvents,
    setStaticEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsRefreshing,
  ]);

  useEffect(() => {
    if (consumers.length > 0 && !updateIntervalRef.current) {
      let timeout = 0;
      if (eventsLastFetched) {
        timeout =
          DATA_STALE_INTERVAL -
          (new Date().getTime() - eventsLastFetched?.getTime());
        if (timeout < 0) {
          timeout = 0;
        }
      }

      updateIntervalRef.current = setTimeout(() => {
        fetchData();
        updateIntervalRef.current = setInterval(() => {
          fetchData();
        }, DATA_STALE_INTERVAL);
      }, timeout);
    } else if (consumers.length === 0 && updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [consumers, eventsLastFetched, eventsRefreshing, fetchData]);

  const subscribe: (id: string) => void = id => {
    if (!consumers.includes(id)) {
      setConsumers([...consumers, id]);
    }
  };

  const unsubscribe: (id: string) => void = id => {
    if (consumers.includes(id)) {
      setConsumers(consumers.filter(consumer => consumer !== id));
    }
  };

  return {
    visibleEvents,
    eventsWithLocation,
    eventsRefreshing,
    fetchData,
    subscribe,
    unsubscribe,
  };
};
