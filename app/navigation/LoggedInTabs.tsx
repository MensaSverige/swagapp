import { Button, ICustomTheme, theme, useTheme } from 'native-base';
import React, { useEffect, useState } from 'react';
import MapView from '../features/map/screens/Map';
import UserSettings from '../features/account/screens/Settings';
import { MapIcon, CalendarIcon, EventsIcon } from './TabBarIcons';
import { EventStackNavigator } from './EventStackNavigation';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSwagNavigation } from './RootStackNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import { Pressable } from '../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { config } from '../gluestack-components/gluestack-ui.config';
import { StyleSheet } from 'react-native';
import { useColorMode } from '@gluestack-ui/themed';
import ExternalEvents from '../features/events/screens/ExternalEvents';

const createStyles1 = (theme: any) =>

  StyleSheet.create({
    settingsIcon: {
      color: theme.vscode_const,
      right: 10
    },
    tabBarStyle: { backgroundColor: theme.background0 },
    tabBarActiveTintColor: { color: theme.primary100 },
    tabBarInactiveTintColor: { color: theme.primary600 },
    headerStyle: { backgroundColor: theme.background0 },
    headerTintColor: { color: theme.primary500 },
  })
  ;

const BottomTab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export const LoggedInTabs = () => {
  const colorMode = useColorMode();
  const [styles, setStyles] = useState(createStyles1(colorMode));

  useEffect(() => {
    const theme = colorMode === 'dark' ? config.themes.dark.colors : config.tokens.colors
    setStyles(createStyles1(theme));
  }, [colorMode]);
  const screenOptions = {
    tabBarStyle: {
      backgroundColor: styles.tabBarStyle.backgroundColor,
    },
    tabBarActiveTintColor: styles.tabBarActiveTintColor.color,
    tabBarInactiveTintColor: styles.tabBarInactiveTintColor.color,
    tabBarShowLabel: true,
    headerStyle: {
      backgroundColor: styles.headerStyle.backgroundColor,
    },
    headerTintColor: styles.headerTintColor.color,
  };
  const navigation = useSwagNavigation();

  const defaultHeaderOptions = {
    headerRight: () => (
      <Pressable
        style={{ marginRight: 10 }}
        onPress={() => navigation.navigate('UserSettings')}
      >
        <FontAwesomeIcon icon={faGear} size={28} style={styles.settingsIcon} />
      </Pressable>

    ),
  };

  return (
    <Stack.Navigator key={colorMode}>
      <Stack.Screen name="LoggedIn" options={{ headerShown: false }}>
        {() => (
          <BottomTab.Navigator screenOptions={screenOptions}>
            <BottomTab.Screen
              name="Schema"
              component={ExternalEvents}
              options={{
                ...defaultHeaderOptions,
                tabBarIcon: CalendarIcon,
              }}
            />
            <BottomTab.Screen
              name="Karta"
              component={MapView}
              options={{
                ...defaultHeaderOptions,
                tabBarIcon: MapIcon,
              }}
            />
            <BottomTab.Screen
              name="EventNavigator"
              options={{
                ...defaultHeaderOptions,
                title: 'Händelser',
                tabBarIcon: EventsIcon,
              }}>
              {() => <EventStackNavigator screenOptions={screenOptions} />}
            </BottomTab.Screen>
          </BottomTab.Navigator>
        )}
      </Stack.Screen>
      <Stack.Screen
        name="UserSettings"
        component={UserSettings}
        options={{
          ...screenOptions,
          title: "Inställningar"
        }}
      />
    </Stack.Navigator>
  );
}
