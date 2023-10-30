import {
  AlertDialog,
  Box,
  Button,
  Center,
  Heading,
  Input,
  VStack,
} from 'native-base';
import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../functions/NavigationTypes';
import {User} from '../types/user';
interface LoginResponse {
  token: string;
  name: string;
  username: string;
  test?: boolean;
}

interface ErrorResponse {
  message: string;
}

type SigninFormProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SigninForm'>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};
export const SigninForm = ({navigation, setUser}: SigninFormProps) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showLoginError, setShowLoginError] = React.useState(false);
  const [loginErrorText, setLoginErrorText] = React.useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('https://swag.mikael.green/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          test: true,
        }),
      });
      if (response.ok) {
        // Login was successful.
        const data: LoginResponse = await response.json();
        const user: User = {
          name: data.name,
          token: data.token,
          username: data.username,
        };
        setUser(user);
        console.log('login data', data);
      } else {
        // Something went wrong with the login.
        if (response.status === 401) {
          console.error('Invalid credentials');
          setLoginErrorText('Fel användarnamn eller lösenord.');
          setShowLoginError(true);
        } else if (response.status === 400) {
          const data: ErrorResponse = await response.json();
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
      // An error occurred while trying to log in.
      console.error('undefined error', error);
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
          />
          <Input
            variant="filled"
            placeholder="Lösenord"
            type="password"
            value={password}
            onChangeText={setPassword}
          />
          <Button mt={8} onPress={handleLogin}>
            Logga in
          </Button>
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
