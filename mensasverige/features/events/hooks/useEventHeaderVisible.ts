import { useSegments } from 'expo-router';
import { useSelectedMainEvent } from './useMainEvents';

/** Tab routes whose default view shows the EventHeader while a main event is selected. */
const EVENT_HEADER_ROUTES = ['(home)', '(events)', 'map'];

/**
 * Whether the blue EventHeader is on screen. The status bar sits above the
 * header and takes its colour, so it needs to know too. Pushed pages inside a
 * tab (guide, event-form) have their own stack header and are excluded.
 *
 * Its own module so that the plain hooks in useMainEvents stay free of
 * expo-router, which the unit tests cannot load.
 */
export const useEventHeaderVisible = (): boolean => {
  const segments = useSegments() as string[];
  const { selectedMainEvent } = useSelectedMainEvent();
  return (
    !!selectedMainEvent &&
    segments.length === 2 &&
    segments[0] === '(tabs)' &&
    EVENT_HEADER_ROUTES.includes(segments[1])
  );
};
