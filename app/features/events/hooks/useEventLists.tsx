import useStore from '../../common/store/store';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  fetchUserEvents,
  fetchUserEvent,
  attendUserEvent,
  unattendUserEvent,
  removeAttendeeFromUserEvent,
} from '../services/eventService';
import FutureUserEvent from '../types/futureUserEvent';

const DATA_STALE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const useEventLists = () => {
  const {
    setUserEvents,
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
    ])
      .then(
        ([
          userEvents,
        ]) => {
          setUserEvents(userEvents);

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
    setUserEvents,,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsRefreshing,
  ]);

  const attendEvent = useCallback(
    async (event: FutureUserEvent) => {
      return attendUserEvent(event).then(() => {
        if (event.id && event.id !== undefined) {
          return fetchEvent(event.id);
        }
        return Promise.reject('Event suddenly has no id');
      });
    },
    [fetchEvent],
  );

  const unattendEvent = useCallback(
    async (event: FutureUserEvent) => {
      return unattendUserEvent(event).then(() => {
        if (event.id && event.id !== undefined) {
          return fetchEvent(event.id);
        }
        return Promise.reject('Event has no id');
      });
    },
    [fetchEvent],
  );

  const removeAttendee = useCallback(
    async (event: FutureUserEvent, userId: number) => {
      if (!event.id) {
        return Promise.reject('Event has no id');
      }
      return removeAttendeeFromUserEvent(event.id, userId).then(() => {
        if (event.id && event.id !== undefined) {
          return fetchEvent(event.id);
        }
        return Promise.reject('Event has no id');
      });
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
    removeAttendee,
    subscribe,
    unsubscribe,
  };
};
