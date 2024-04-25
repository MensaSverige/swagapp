import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import EventForm from '../features/events/screens/EventForm';
import EventList from '../features/events/screens/EventList';

const EventStack = createNativeStackNavigator();
export const EventStackNavigator: React.FC<{
  screenOptions: NativeStackNavigationOptions;
}> = ({screenOptions}) => {
  return (
    <EventStack.Navigator screenOptions={screenOptions}>
      <EventStack.Screen
        name="Event"
        component={EventList}
        options={{
          headerShown: false,
        }}
      />
      <EventStack.Screen
        name="EventForm"
        component={EventForm}
        options={{
          headerShown: true,
          title: 'Skapa evenemang',
          presentation: 'modal',
        }}
      />
    </EventStack.Navigator>
  );
};
