import {Event} from './event';

type FutureEvent = Event & {_isFutureEvent: true};

export function isFutureEvent(event: Event): event is FutureEvent {
  const now = new Date();
  const eventDate = new Date(event.start);
  if (eventDate.getTime() > now.getTime()) {
    return true;
  }
  if (event.end) {
    const endDate = new Date(event.end);
    if (endDate.getTime() > now.getTime()) {
      return true;
    }
  } else {
    // Events without end date are shown for one hour
    eventDate.setHours(eventDate.getHours() + 1);
    if (eventDate.getTime() > now.getTime()) {
      return true;
    }
  }
  return false;
}

export default FutureEvent;
