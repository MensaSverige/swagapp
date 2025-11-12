import { useCallback } from 'react';
import { Event } from '../../../api_schema/types';
import { attendEvent, unattendEvent } from '../services/eventService';
import useStore from '../../common/store/store';

export const useEventAttendance = () => {
  const { events, setEvents } = useStore();

  const updateEventAttendingStatus = useCallback((eventId: string, attending: boolean) => {
    const updatedEvents = events.map(event => 
      event.id === eventId 
        ? { ...event, attending }
        : event
    );
    setEvents(updatedEvents);
  }, [events, setEvents]);

  const attendEventById = useCallback(
    async (eventId: string) => {
      try {
        const updatedEvent = await attendEvent(eventId);
        // Update the event in the store with the returned data
        const updatedEvents = events.map(event => 
          event.id === eventId ? updatedEvent : event
        );
        setEvents(updatedEvents);
        return true;
      } catch (error) {
        console.error('Error attending event:', error);
        throw error;
      }
    },
    [events, setEvents]
  );

  const unattendEventById = useCallback(
    async (eventId: string) => {
      try {
        await unattendEvent(eventId);
        updateEventAttendingStatus(eventId, false);
        return true;
      } catch (error) {
        console.error('Error unattending event:', error);
        throw error;
      }
    },
    [updateEventAttendingStatus]
  );

  return {
    attendEventById,
    unattendEventById,
  };
};