import apiClient from '../../common/services/apiClient';
import {ExternalRoot, Event} from '../../../api_schema/types';

export const fetchExternalRoot = async (): Promise<ExternalRoot> => {
  return apiClient
    .get('/external_root')
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
      console.error('Error fetching external root:', error);
      throw error;
    });
};

export const fetchEvents = async (params?: {
  attending?: boolean;
  bookable?: boolean;
  official?: boolean;
}): Promise<Event[]> => {
  return apiClient
    .get('/events', { params })
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
      console.error('Error fetching events:', error);
      throw error;
    });
};

export const createEvent = async (event: Event): Promise<Event> => {
  return apiClient
    .post('/events', event)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('No data received');
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error creating event:', error);
      throw error;
    });
};

export const updateEvent = async (
  eventId: string,
  event: Event,
): Promise<Event> => {
  return apiClient
    .put(`/events/${eventId}`, event)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('No data received');
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error updating event:', error);
      throw error;
    });
};



export const attendEvent = async (eventId: string): Promise<Event> => {
  return apiClient
    .post(`/events/${eventId}/attend`)
    .then(
      response => {
        if (response.data) {
          return response.data;
        }
        throw new Error('No data received');
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error attending event:', error);
      throw error;
    });
};

export const unattendEvent = async (eventId: string): Promise<boolean> => {
  return apiClient
    .post(`/events/${eventId}/unattend`)
    .then(
      response => {
        return response.status === 200;
      },
      error => {
        throw new Error(error.message || error);
      },
    )
    .catch(error => {
      console.error('Error unattending event:', error);
      throw error;
    });
};
