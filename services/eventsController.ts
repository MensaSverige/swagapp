import useStore from '../store/store';
import apiClient from '../apiClient';
import {useCallback, useEffect, useRef, useState} from 'react';

const DATA_STALE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const useEventsController = () => {
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
  const updateIntervalRef = useRef<Number | null>(null);

  const fetchData = useCallback(async () => {
    if (eventsRefreshing) {
      return;
    }

    setEventsRefreshing(true);

    // Fetch user events
    const userEventsResponse = await apiClient.get('/event');
    if (userEventsResponse.status === 200) {
      setUserEvents(userEventsResponse.data);
    }

    // Fetch static events
    const staticEventsResponse = await apiClient.get('/static_events');
    if (staticEventsResponse.status === 200) {
      setStaticEvents(staticEventsResponse.data);
    }

    const lastFetched = new Date();
    setEventsLastFetched(lastFetched);
    setEventsRefreshing(false);
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
      clearInterval(updateIntervalRef.current as number);
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
