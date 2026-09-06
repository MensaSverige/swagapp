import { Event } from '../../../api_schema/types';
import { EventFilter, ExtendedEvent, GroupedEvents } from '../types/eventUtilTypes';
import { EventFilterOptions } from '../store/EventsSlice';

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

/**
 * Apply the rich EventFilterOptions filter used on the events list screen.
 * Pure function — no side effects, safe to call in useMemo.
 */
export const filterByOptions = (events: ExtendedEvent[], eventFilter: EventFilterOptions): ExtendedEvent[] => {
  const now = new Date();
  const fromDate = eventFilter.dateFrom ? new Date(eventFilter.dateFrom) : now;
  const toDate = eventFilter.dateTo ? new Date(eventFilter.dateTo) : null;
  const categorySet =
    eventFilter.categories && eventFilter.categories.length > 0
      ? new Set(eventFilter.categories)
      : null;

  return events.filter(event => {
    if (eventFilter.attendingOrHost !== null && eventFilter.attendingOrHost !== undefined) {
      if (event.attendingOrHost !== eventFilter.attendingOrHost) return false;
    }
    if (eventFilter.bookable !== null && eventFilter.bookable !== undefined) {
      if (event.bookable !== eventFilter.bookable) return false;
    }
    if (eventFilter.official !== null && eventFilter.official !== undefined) {
      if (event.official !== eventFilter.official) return false;
    }
    if (categorySet) {
      if (!event.tags || !event.tags.some(tag => categorySet.has(tag.code))) return false;
    }
    if (!event.start) return false;
    const eventStartDate = new Date(event.start);
    if (event.end) {
      const eventEndDate = new Date(event.end);
      if (eventStartDate <= now && eventEndDate >= now) return true; // ongoing event
    }
    if (eventStartDate < fromDate) return false;
    if (toDate && eventStartDate > toDate) return false;
    return true;
  });
};

/** Count bookable events per tag code. */
export const calcCategoryCounts = (events: ExtendedEvent[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  events
    .filter(e => e.bookable)
    .forEach(e => {
      e.tags?.forEach(tag => {
        if (tag.code) counts[tag.code] = (counts[tag.code] || 0) + 1;
      });
    });
  return counts;
};

/** Return top N category codes sorted by event count. */
export const getTopCategories = (counts: Record<string, number>, limit = 5): string[] =>
  Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([code]) => code);


/**
 * Attending/hosting events that have not already finished, soonest first.
 *
 * The dashboard shows the first few of these. Sorting ascending and slicing
 * off an unfiltered list surfaces the *oldest* events, so past ones must be
 * excluded here rather than by the caller. An event that has started but not
 * ended still counts — it is happening now.
 */
export const selectDashboardEvents = (
  events: ExtendedEvent[],
  now: number = Date.now(),
): ExtendedEvent[] =>
  events
    .filter(e => {
      if (!e.attendingOrHost || !e.start) return false;
      if (new Date(e.start).getTime() >= now) return true;
      return e.end ? new Date(e.end).getTime() >= now : false;
    })
    .sort(
      (a, b) =>
        (a.start ? new Date(a.start).getTime() : 0) -
        (b.start ? new Date(b.start).getTime() : 0),
    );

/** Bookable events starting within the next `hours`. */
export const selectLastMinuteEvents = (
  events: ExtendedEvent[],
  hours: number,
  now: number = Date.now(),
): ExtendedEvent[] => {
  const until = now + hours * 3600_000;
  return events.filter(e => {
    if (!e.bookable || !e.start) return false;
    const start = new Date(e.start).getTime();
    return start >= now && start <= until;
  });
};

