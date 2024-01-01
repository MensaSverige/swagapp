import {ICustomTheme, useTheme} from 'native-base';
import React from 'react';
import MapView from '../features/map/screens/Map';
import Profile from '../features/account/screens/Profile';
import {MapIcon, CalendarIcon, ProfileIcon} from './TabBarIcons';
import {EventStackNavigator} from './EventStackNavigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const BottomTab = createBottomTabNavigator();

export const LoggedInTabs = () => {
  const theme = useTheme() as ICustomTheme;
  const screenOptions = {
    tabBarStyle: {
      backgroundColor: theme.colors.background[900],
    },
    tabBarActiveTintColor: theme.colors.primary[50],
    tabBarInactiveTintColor: theme.colors.primary[900],
    tabBarShowLabel: true,
    headerStyle: {
      backgroundColor: theme.colors.background[900],
    },
    headerTintColor: theme.colors.primary[500],
  };
  return (
    <BottomTab.Navigator screenOptions={screenOptions}>
      <BottomTab.Screen
        name="Map"
        component={MapView}
        options={{
          tabBarIcon: MapIcon,
        }}
      />
      <BottomTab.Screen
        name="Events"
        options={{
          headerShown: false,
          tabBarIcon: CalendarIcon,
        }}>
        {() => <EventStackNavigator screenOptions={screenOptions} />}
      </BottomTab.Screen>
      <BottomTab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </BottomTab.Navigator>
  );
}
