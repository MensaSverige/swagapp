import useStore from '../store';
import apiClient from '../apiClient';

const DATA_STALE_INTERVAL = 1000 * 60 * 5; // 5 minutes

export const useEventsController = () => {
  const {
    setUserEvents,
    setStaticEvents,
    setEventsRefreshing,
    setEventsLastFetched,
    eventsLastFetched,
    eventsRefreshing,
    visibleEvents,
  } = useStore();

  const fetchData = async () => {
    if (eventsRefreshing) {
      return;
    }

    console.log('fetchData started');
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
  };

  const eventsConsumerVisible = () => {
    const now = new Date();
    if (
      !eventsLastFetched ||
      now.getTime() - eventsLastFetched.getTime() > DATA_STALE_INTERVAL
    ) {
      fetchData();
    }
  };

  return {
    visibleEvents,
    eventsRefreshing,
    fetchData,
    eventsConsumerVisible,
  };
};
