import {createNativeStackNavigator, NativeStackNavigationOptions} from '@react-navigation/native-stack';
import EventForm from '../features/events/screens/EventForm';
import EventList from '../features/events/screens/EventList';

const EventStack = createNativeStackNavigator();
export const EventStackNavigator: React.FC<{ screenOptions: NativeStackNavigationOptions }> = ({ screenOptions }) => {
  return (
    <EventStack.Navigator screenOptions={screenOptions}>
      <EventStack.Screen
        name="Event"
        component={EventList}
        options={{
          title: 'Evenemang',
        }}
      />
      <EventStack.Screen
        name="EventForm"
        component={EventForm}
        options={{
          title: 'Skapa evenemang',
          presentation: 'modal',
        }}
      />
    </EventStack.Navigator>
  );
}
