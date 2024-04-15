import useStore from '../../common/store/store';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  fetchExternalEvents,
  // fetchStaticEvents,
  fetchUserEvents,
  fetchUserEvent,
  attendUserEvent,
  unattendUserEvent,
} from '../services/eventService';
import FutureUserEvent from '../types/futureUserEvent';

const DATA_STALE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const useEventLists = () => {
  const {
    setUserEvents,
    // setStaticEvents,
    setExternalEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsRefreshing,
    eventsLastFetched,
    visibleEvents,
    eventsWithLocation,
    userEvents: existingUserEvents,
  } = useStore();

  const [consumers, setConsumers] = useState<string[]>([]);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEvent = useCallback(
    async (id: string) => {
      setEventsRefreshing(true);
      return fetchUserEvent(id)
        .then(event => {
          // Replace event in user events
          const newUserEvents = existingUserEvents.map(userEvent =>
            userEvent.id === id ? event : userEvent,
          );
          setUserEvents(newUserEvents);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        })
        .finally(() => {
          setEventsRefreshing(false);
        });
    },
    [setEventsRefreshing, setUserEvents, existingUserEvents],
  );

  const fetchAllEvents = useCallback(async () => {
    if (eventsRefreshing) {
      return;
    }

    setEventsRefreshing(true);

    return Promise.all([
      fetchUserEvents(),
      // fetchStaticEvents(),
      fetchExternalEvents(),
    ])
      .then(
        ([
          userEvents,
          // staticEvents,
          external_events,
        ]) => {
          setUserEvents(userEvents);
          // setStaticEvents(staticEvents);
          setExternalEvents(external_events);
        },
      )
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
    // setStaticEvents,
    setExternalEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsRefreshing,
  ]);

  const attendEvent = useCallback(
    async (event: FutureUserEvent) => {
      if (event.id !== undefined) {
        const event_id = event.id;
        return attendUserEvent(event).then(() => {
          return fetchEvent(event_id);
        });
      }
      return Promise.reject('Event has no id');
    },
    [fetchEvent],
  );

  const unattendEvent = useCallback(
    async (event: FutureUserEvent) => {
      if (event.id !== undefined) {
        const event_id = event.id;
        return unattendUserEvent(event).then(() => {
          return fetchEvent(event_id);
        });
      }
      return Promise.reject('Event has no id');
    },
    [fetchEvent],
  );

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
        fetchAllEvents();
        updateIntervalRef.current = setInterval(() => {
          fetchAllEvents();
        }, DATA_STALE_INTERVAL);
      }, timeout);
    } else if (consumers.length === 0 && updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [consumers, eventsLastFetched, eventsRefreshing, fetchAllEvents]);

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
    fetchAllEvents,
    fetchEvent,
    attendEvent,
    unattendEvent,
    subscribe,
    unsubscribe,
  };
};
