import EventWithLocation from './eventWithLocation';
import UserEventWithLocation from './userEventWithLocation';
import {UserEvent} from './user_event';
import {Event} from './event';
import {isFutureEvent} from './futureEvent';

type FutureUserEvent = UserEvent & {_isFutureUserEvent: true};

export function isFutureUserEvent(
  event: Event | UserEvent | EventWithLocation | UserEventWithLocation,
): event is FutureUserEvent {
  if (!('owner' in event)) {
    return false; // Not a user event
  }

  return isFutureEvent(event);
}

export default FutureUserEvent;
