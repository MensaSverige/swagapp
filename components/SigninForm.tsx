import {
  AlertDialog,
  Box,
  Button,
  Center,
  Heading,
  Input,
  Spinner,
  VStack,
} from 'native-base';
import React from 'react';
import {User} from '../types/user';
import useStore from '../store';
import * as Keychain from 'react-native-keychain';
import api from '../apiClient';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';

interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

interface ErrorResponse {
  message: string;
}

export const SigninForm = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  const [showLoginError, setShowLoginError] = React.useState(false);
  const [loginErrorText, setLoginErrorText] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(false);

  const store = useStore();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth', {
        username: username,
        password: password,
        test: store.config.testMode,
      });

      setIsLoading(false);

      if (response.status === 200) {
        const data: LoginResponse = response.data;
        console.log('data', data);
        const user: User = data.user;

        if (data.access_token && data.refresh_token) {
          store.setUser(user);
          await Keychain.setGenericPassword('accessToken', data.access_token, {
            service: 'accessToken',
          });
          await Keychain.setGenericPassword(
            'refreshToken',
            data.refresh_token,
            {
              service: 'refreshToken',
            },
          );
        } else {
          console.error('Received null accessToken or refreshToken');
          setLoginErrorText('Något gick fel. Försök igen senare.');
          setShowLoginError(true);
        }
      } else {
        // Something went wrong with the login.
        if (response.status === 401) {
          console.error('Invalid credentials');
          setLoginErrorText('Fel användarnamn eller lösenord.');
          setShowLoginError(true);
        } else if (response.status === 400) {
          const data: ErrorResponse = response.data;
          if (data.message === 'Test mode is not enabled') {
            setLoginErrorText(
              'Testläge är inte aktiverat i backend. Appen borde inte köras i testläge.',
            );
          } else {
            console.log('error data', data);
            setLoginErrorText('Något gick fel. Försök igen senare.');
          }
          setShowLoginError(true);
        }
      }
    } catch (error) {
      console.error('Login error', error);
      setLoginErrorText('Något gick fel. Försök igen senare.');
      setShowLoginError(true);
      setIsLoading(false);
    }
  };

  const cancelRef = React.useRef(null);

  return (
    <Center w="100%" h="100%">
      <Box safeArea flex={1} p={10} w="100%" mx="auto">
        <Heading size="lg">Välkommen Swagger</Heading>
        <Heading mt="1" fontWeight="medium" size="xs">
          Logga in med dina Mensa.se-uppgifter
        </Heading>

        <VStack space={4} mt={5}>
          <Input
            variant="filled"
            placeholder="Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="email-address"
            isDisabled={isLoading}
          />
          <Input
            variant="filled"
            placeholder="Lösenord"
            type={passwordVisible ? 'text' : 'password'}
            value={password}
            onChangeText={setPassword}
            isDisabled={isLoading}
            InputRightElement={
              <Button
                ml={1}
                bg="transparent"
                roundedLeft={0}
                roundedRight="md"
                onPress={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? (
                  <FontAwesomeIcon icon={faEyeSlash} />
                ) : (
                  <FontAwesomeIcon icon={faEye} />
                )}
              </Button>
            }
          />
          {isLoading ? (
            <Spinner />
          ) : (
            <Button mt={8} onPress={handleLogin}>
              {store.config.testMode ? 'Logga in i testläge' : 'Logga in'}
            </Button>
          )}
        </VStack>
        <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={showLoginError}
          onClose={() => {
            setShowLoginError(false);
          }}>
          <AlertDialog.Content>
            <AlertDialog.Header>Fel vid inloggning</AlertDialog.Header>
            <AlertDialog.Body>{loginErrorText}</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button ref={cancelRef} onPress={() => setShowLoginError(false)}>
                OK
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Content>
        </AlertDialog>
      </Box>
    </Center>
  );
};
