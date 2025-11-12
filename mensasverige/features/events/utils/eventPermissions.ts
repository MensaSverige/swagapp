import { Event, User } from '../../../api_schema/types';

/**
 * Checks if a user can edit an event.
 * A user can edit an event if:
 * 1. The event is not an official event (user events only)
 * 2. The user is the owner (event.userId matches user.userId) OR their userId is in the admin array
 */
export const canUserEditEvent = (event: Event, user: User | null): boolean => {
  if (!user) {
    return false;
  }
  
  // Official events cannot be edited by users
  if (event.official) {
    return false;
  }
  
  // Check if user is the owner via userId field
  if ('userId' in event && event.userId === user.userId) {
    return true;
  }
  
  // Check if user is in the admin array (fallback)
  if (event.admin && event.admin.includes(user.userId)) {
    return true;
  }
  
  return false;
};