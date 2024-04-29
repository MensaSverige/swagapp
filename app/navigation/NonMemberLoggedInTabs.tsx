import React, { useEffect, useState } from 'react';
import {
    CalendarIcon, InformationIcon
} from './TabBarIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSwagNavigation } from './RootStackNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './RootStackParamList';
import {
    HStack,
    KeyboardAvoidingView,
    Pressable,
} from '../gluestack-components';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { config } from '../gluestack-components/gluestack-ui.config';
import { Platform, StyleSheet } from 'react-native';
import { useColorMode } from '@gluestack-ui/themed';
import MyExternalEvents from '../features/events/screens/MyExternalEvents';
import WelcomeScreen from '../features/common/screens/WelcomeScreen';
import NonMemberUserSettings from '../features/account/screens/NonMemberSettings';

const createStyles1 = (theme: any, colorMode: string) =>
    StyleSheet.create({
        settingsIcon: {
            color: theme.primary500,
            right: 10,
        },
        InfoIcon: {
            color: colorMode === 'dark' ? theme.vscode_var : theme.info300,
            right: 10,
        },
        tabBarStyle: { backgroundColor: theme.background0 },
        tabBarActiveTintColor: {
            color: colorMode === 'dark' ? theme.info700 : theme.primary200,
        },
        tabBarInactiveTintColor: {
            color: colorMode === 'dark' ? theme.info400 : theme.primary600,
        },
        headerStyle: { backgroundColor: theme.background0 },
        headerTintColor: { color: theme.primary600 },
    });
const BottomTab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

export const NonMemberLoggedInTabs = () => {
    const colorMode = useColorMode();
    const [styles, setStyles] = useState(
        createStyles1(config.tokens.colors, colorMode),
    );

    useEffect(() => {
        const theme =
            colorMode === 'dark'
                ? config.themes.dark.colors
                : config.tokens.colors;
        setStyles(createStyles1(theme, colorMode));
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
            <HStack space="sm" alignItems="center" paddingRight={2}>
                <Pressable
                    style={{ marginRight: 10 }}
                    onPress={() => navigation.navigate('UserSettings')}>
                    <FontAwesomeIcon
                        icon={faGear}
                        size={28}
                        style={styles.settingsIcon}
                    />
                </Pressable>
            </HStack>
        ),
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
            <Stack.Navigator key={colorMode}>
                <Stack.Screen name="LoggedIn" options={{ headerShown: false }}>
                    {() => (
                        <BottomTab.Navigator screenOptions={screenOptions}>
                            <BottomTab.Screen
                                name="Information"
                                component={WelcomeScreen}
                                options={{
                                    ...defaultHeaderOptions,
                                    tabBarIcon: InformationIcon,
                                }}
                            />
                            <BottomTab.Screen
                                name="Schema"
                                component={MyExternalEvents}
                                options={{
                                    ...defaultHeaderOptions,
                                    tabBarIcon: CalendarIcon,
                                }}
                            />
                        </BottomTab.Navigator>
                    )}
                </Stack.Screen>
                <Stack.Screen
                    name="UserSettings"
                    component={NonMemberUserSettings}
                    options={{
                        ...screenOptions,
                        title: 'Inställningar',
                        headerBackTitle: 'Tillbaka',
                    }}
                />
            </Stack.Navigator>
        </KeyboardAvoidingView>
    );
};
