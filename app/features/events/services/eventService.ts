import apiClient from '../../common/services/apiClient';
import FutureUserEvent, {isFutureUserEvent} from '../types/futureUserEvent';
import FutureEvent, {isFutureEvent} from '../types/futureEvent';
import {UserEvent} from '../../common/types/user_event';

export const fetchUserEvents = async (): Promise<FutureUserEvent[]> => {
  return apiClient
    .get('/user_event')
    .then(
      response => {
        if (response.data) {
          return response.data.filter(isFutureUserEvent);
        }
        return [];
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error fetching user events:', error);
      throw error; // Needed to propagate the error to the caller view
    });
};

  export const fetchExternalEvents = async (): Promise<FutureEvent[]> => {
    return apiClient
      .get('/external_events')
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
        console.error('Error fetching external events:', error);
      });
  }

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
    .put(`/user_event/${eventId}`, event)
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
    .post('/user_event', event)
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
