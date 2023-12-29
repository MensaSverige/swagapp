import {createNativeStackNavigator, NativeStackNavigationOptions} from '@react-navigation/native-stack';
import EventForm from '../components/Events/EventForm';
import Events from '../components/Events/Events';

const EventStack = createNativeStackNavigator();
export const EventStackNavigator: React.FC<{ screenOptions: NativeStackNavigationOptions }> = ({ screenOptions }) => {
  return (
    <EventStack.Navigator screenOptions={screenOptions}>
      <EventStack.Screen
        name="Event"
        component={Events}
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
