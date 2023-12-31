import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './RootStackParamList';
import {LoggedInTabs} from './LoggedInTabs';
import useStore from '../store/store';
import {LoadingScreen} from '../components/LoadingScreen';
import {SigninForm} from '../components/SigninForm';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootStackNavigation = () => {
  const {user, isTryingToLogin} = useStore();
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start" options={{headerShown: false}}>
          {() => {
            if (isTryingToLogin) {
              return <LoadingScreen />;
            } else if (user === null) {
              return <SigninForm />;
            } else {
              return <LoggedInTabs />;
            }
          }}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
