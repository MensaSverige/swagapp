import {
  AlertDialog,
  Box,
  Button,
  Center,
  Checkbox,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  useTheme,
} from 'native-base';
import React, {useEffect, useState, useRef} from 'react';
import {User} from '../../common/types/user';
import useStore from '../../common/store/store';
import * as Keychain from 'react-native-keychain';
import apiClient from '../../common/services/apiClient';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';
import {TEST_MODE} from '@env';

interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

interface ErrorResponse {
  message: string;
}

export const SigninForm = () => {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);

  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorText, setLoginErrorText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isTryingStoredCredentials, setIsTryingStoredCredentials] =
    useState(false);

  const store = useStore();

  const {backendConnection, user, setUser, setIsTryingToLogin} = useStore();

  useEffect(() => {
    if (!user && backendConnection) {
      Keychain.getAllGenericPasswordServices().then(allSavedCredentials => {
        if (
          allSavedCredentials.some(
            credential =>
              credential === 'accessToken' ||
              credential === 'refreshToken' ||
              credential === 'credentials',
          )
        ) {
          setIsTryingStoredCredentials(true);
          setIsLoading(true);
          setIsTryingToLogin(true);
          apiClient
            .get('/user/me')
            .then(response => {
              if (response.status === 200) {
                const userData: User = response.data;
                setUser(userData);
              } else {
                return response.data().then((data: any) => {
                  throw new Error(`Could not get user object. Data: ${data}`);
                });
              }
            })
            .catch(error => {
              if (!error.message.includes('Network Error')) {
                // Error was not Network Error, which means login failed due to invalid credentials.
                setIsTryingStoredCredentials(false);
                Keychain.resetGenericPassword();
              }
            })
            .finally(() => {
              setIsTryingToLogin(false);
            });
        } else {
          setIsTryingToLogin(false);
        }
      });
    }
  }, [
    user,
    setUser,
    backendConnection,
    setIsTryingToLogin,
    setIsTryingStoredCredentials,
  ]);

  const handleLogin = async () => {
    try {
      if (saveCredentials) {
        Keychain.setGenericPassword(username, password, {
          service: 'credentials',
        });
      }
    } catch (error) {
      console.error('Save credentials error', error);
      setLoginErrorText(
        'Något gick fel. Kunde inte spara dina inloggningsuppgifter.',
      );
      setShowLoginError(true);
    }

    setIsLoading(true);
    apiClient
      .post('/auth', {
        username: username,
        password: password,
        test: store.testMode,
      })
      .then(async response => {
        if (response.status === 200) {
          const data: LoginResponse = response.data;
          const responseUser: User = data.user;

          if (data.access_token && data.refresh_token) {
            store.setUser(responseUser);
            return Promise.all([
              Keychain.setGenericPassword('accessToken', data.access_token, {
                service: 'accessToken',
              }),
              Keychain.setGenericPassword('refreshToken', data.refresh_token, {
                service: 'refreshToken',
              }),
            ]).catch(error => {
              console.error('Keychain error', error);
              setLoginErrorText(
                'Något gick fel. Kunde inte spara dina inloggningsuppgifter.',
              );
              setShowLoginError(true);
            });
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
              console.error('backend responded with status 400', data);
              setLoginErrorText('Något gick fel. Försök igen senare.');
            }
            setShowLoginError(true);
          }
        }
      })
      .catch(error => {
        console.error('Login error', error.message || error);
        if (error.message.includes('Network Error')) {
          setLoginErrorText(
            `Det går inte att nå servern just nu. ${
              isTryingStoredCredentials
                ? 'Försöker igen automatiskt'
                : 'Försök igen om en stund.'
            }`,
          );
        } else {
          setLoginErrorText('Något gick fel. Försök igen senare.');
        }
        setShowLoginError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const cancelRef = useRef(null);

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
            InputRightElement={
              <Button ml={1} bg="transparent" isDisabled>
                <FontAwesomeIcon icon={faEye} color="transparent" />
              </Button>
            }
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
                  <FontAwesomeIcon
                    icon={faEyeSlash}
                    color={theme.colors.primary[500]}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faEye}
                    color={theme.colors.primary[500]}
                  />
                )}
              </Button>
            }
          />
          <Checkbox value="saveCredentials" onChange={setSaveCredentials}>
            <Text>Spara inloggning</Text>
          </Checkbox>
          {isLoading ? (
            <Spinner />
          ) : (
            <Button
              mt={8}
              onPress={handleLogin}
              isDisabled={!backendConnection}>
              {TEST_MODE ? 'Logga in' : 'Logga in i testläge'}
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
