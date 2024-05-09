import apiClient from '../../common/services/apiClient';
import FutureUserEvent, {isFutureUserEvent} from '../types/futureUserEvent';
import FutureEvent, {isFutureEvent} from '../types/futureEvent';
import {ExternalEventDetails, News, UserEvent} from '../../../api_schema/types';

export const fetchUserEvent = async (
  eventId: string,
): Promise<FutureUserEvent> => {
  return apiClient
    .get(`/user_events/${eventId}`)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        return null;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching user event:', error);
      throw error;
    });
};

export const fetchUserEvents = async (): Promise<FutureUserEvent[]> => {
  return apiClient
    .get('/user_events')
    .then(
      response => {
        if (response.data) {
          return response.data.filter(isFutureUserEvent).sort((a: FutureUserEvent, b: FutureUserEvent) => {
            if (a.start && b.start) {
              return a.start < b.start ? -1 : 1;
            }
            return 0;
          });
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching user events:', error);
      throw error;
    });
};

export const fetchExternalEvents = async (): Promise<ExternalEventDetails[]> => {
  return apiClient
    .get('/external_events/booked')
    .then(
      response => {
        if (response.data) {
          console.log('External events:', response.data);
          return response.data;
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching external events:', error);
    });
};


export const fetchNews = async (): Promise<News[]> => {
  return apiClient
    .get('/external_events/news')
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching news:', error);
    });
};


export const fetchStaticEvents = async (): Promise<FutureEvent[]> => {
  return apiClient
    .get('/static_events')
    .then(
      response => {
        if (response.data) {
          return response.data.filter(isFutureEvent);
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching static events:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};
export const updateUserEvent = async (
  eventId: string,
  event: UserEvent,
): Promise<UserEvent> => {
  console.log('Updating user event:', event);
  return apiClient
    .put(`/user_events/${eventId}`, event)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error updating user event:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};

export const createUserEvent = async (event: UserEvent): Promise<UserEvent> => {
  return apiClient
    .post('/user_events', event)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error creating user event:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};

export const attendUserEvent = async (
  event: FutureUserEvent,
): Promise<boolean> => {
  return apiClient
    .post(`/user_events/${event.id}/attend`)
    .then(
      response => {
        return response.status === 200;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error attending user event:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};

export const unattendUserEvent = async (
  event: FutureUserEvent,
): Promise<boolean> => {
  return apiClient
    .post(`/user_events/${event.id}/unattend`)
    .then(
      response => {
        return response.status === 200;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error unattending user event:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};

export const removeAttendeeFromUserEvent = async (
  eventId: string,
  userId: number,
): Promise<boolean> => {
  return apiClient
    .delete(`/user_events/${eventId}/attendees/${userId}`)
    .then(
      response => {
        return response.status === 200;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error removing attendee from user event:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};
