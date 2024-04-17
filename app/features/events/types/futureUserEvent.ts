import {Event} from '../../common/types/event';
import {ExtendedUserEvent} from '../../../api_schema/types'; // Import the UserEvent class

export type FutureUserEvent = ExtendedUserEvent & {
  _isFutureUserEvent: true;
};

export function isFutureUserEvent(
  event: Event | ExtendedUserEvent,
): event is FutureUserEvent {
  // Check if the event is a UserEvent
  if (!(event as ExtendedUserEvent).userId) {
    return false;
  }

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
    // UserEvents without end date are shown for one hour
    eventDate.setHours(eventDate.getHours() + 1);
    if (eventDate.getTime() > now.getTime()) {
      return true;
    }
  }
  return false;
}

export default FutureUserEvent;
