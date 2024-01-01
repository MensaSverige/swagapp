import FutureUserEvent from '../features/events/types/futureUserEvent';

export type RootStackParamList = {
  Start: undefined;
  Map: undefined;
  Event: undefined;
  EventForm: { event: FutureUserEvent | null; };
  Profile: undefined;
};
