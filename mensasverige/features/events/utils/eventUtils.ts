import { Event } from '../../../api_schema/types';
import { EventFilter, ExtendedEvent, GroupedEvents } from '../types/eventUtilTypes';

/**
 * Check if user is effectively attending an event (including admin/host status)
 */
export const isUserEffectivelyAttending = (event: Event, currentUserId?: number): boolean => {
  if (!currentUserId) return event.attending || false;
  
  // Check if user is explicitly attending
  if (event.attending) return true;
  
  // Check if user is an admin
  if (event.admin && event.admin.includes(currentUserId)) return true;
  
  // Check if user is a host
  if (event.hosts && event.hosts.some(host => host.userId === currentUserId)) return true;
  
  return false;
};

/**
 * Check if an event is in the future
 */
export const isFutureEvent = (event: Event): boolean => {
  if (!event.start) return false;
  
  const now = new Date();
  const eventStartDate = new Date(event.start);
  
  return eventStartDate > now;
};

/**
 * Convert a regular Event to an ExtendedEvent with computed properties
 */
export const createExtendedEvent = (event: Event, currentUserId?: number): ExtendedEvent => {
  return {
    ...event,
    attendingOrHost: isUserEffectivelyAttending(event, currentUserId),
    isFutureEvent: isFutureEvent(event)
  };
};

export const displayLocaleTimeStringDate = (datestring: string) => {
    const date: Date = new Date(datestring ?? "");
    const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
    return `${capitalizedWeekday} ${dayMonth}`;
};

/**
 * Sort events by start date in ascending order
 */
export const sortEventsByDate = (events: ExtendedEvent[]): ExtendedEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = a.start ? new Date(a.start).getTime() : 0;
    const dateB = b.start ? new Date(b.start).getTime() : 0;
    return dateA - dateB;
  });
};

/**
 * Check if an event is upcoming (end time is in the future)
 */
export const isEventUpcoming = (event: ExtendedEvent): boolean => {
  if (!event.start || !event.end) return false;
  
  const now = new Date();
  const eventDate = new Date(event.start);
  
  // Parse end time and set it on the event date
  const [hours, minutes] = event.end.split(':');
  eventDate.setHours(parseInt(hours), parseInt(minutes));
  
  return eventDate > now;
};

/**
 * Filter events based on provided criteria
 */
export const filterEvents = (events: ExtendedEvent[], filter: EventFilter = {}): ExtendedEvent[] => {
  let filteredEvents = [...events];

  // Filter by attending status (including admin/host status)
  if (filter.attendingOrHost !== undefined) {
    filteredEvents = filteredEvents.filter(event => 
      event.attendingOrHost === filter.attendingOrHost
    );
  }

  // Filter by upcoming status
  if (filter.upcoming) {
    filteredEvents = filteredEvents.filter(isEventUpcoming);
  }

  // Sort by date
  filteredEvents = sortEventsByDate(filteredEvents);

  // Apply limit
  if (filter.limit) {
    filteredEvents = filteredEvents.slice(0, filter.limit);
  }

  return filteredEvents;
};

/**
 * Group events by date string
 */
export const groupEventsByDate = (events: ExtendedEvent[]): GroupedEvents => {
  return events.reduce((grouped, event) => {
    const date = event.start ? new Date(event.start).toDateString() : 'No Date';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
    return grouped;
  }, {} as GroupedEvents);
};


