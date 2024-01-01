import apiClient from '../../common/services/apiClient';
import {Event} from '../../common/types/event';
import FutureUserEvent, {isFutureUserEvent} from '../types/futureUserEvent';
import FutureEvent, {isFutureEvent} from '../types/futureEvent';

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
      });
  }
export const updateUserEvent = async (eventId: string, event: Event): Promise<Event> => {
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
      });
  }

  export const createUserEvent = async (event: Event): Promise<Event> => {
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
      });
  }
