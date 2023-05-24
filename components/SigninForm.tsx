import {
  AlertDialog,
  Box,
  Button,
  Center,
  FormControl,
  Heading,
  Input,
  VStack,
} from 'native-base';
import React from 'react';

interface LoginResponse {
  token: string;
  name: string;
  username: string;
  test?: boolean;
}

interface ErrorResponse {
  message: string;
}

export const SignupForm = () => {
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
    <Center w="100%">
      <Box safeArea p="2" w="90%" maxW="290" py="8">
        <Heading
          size="lg"
          color="coolGray.800"
          _dark={{
            color: 'warmGray.50',
          }}
          fontWeight="semibold">
          Välkommen Swagger
        </Heading>
        <Heading
          mt="1"
          color="coolGray.600"
          _dark={{
            color: 'warmGray.200',
          }}
          fontWeight="medium"
          size="xs">
          Logga in med dina Mensa.se-uppgifter
        </Heading>
        <VStack space={3} mt="5">
          <FormControl>
            <FormControl.Label>Användarnamn</FormControl.Label>
            <Input value={username} onChangeText={setUsername} />
          </FormControl>
          <FormControl>
            <FormControl.Label>Lösenord</FormControl.Label>
            <Input
              type="password"
              value={password}
              onChangeText={setPassword}
            />
          </FormControl>
          <Button mt="2" colorScheme="indigo" onPress={handleLogin}>
            Logga in
          </Button>
        </VStack>
      </Box>
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={showLoginError}
        onClose={() => {
          setShowLoginError(false);
        }}>
        <AlertDialog.Content>
          <AlertDialog.Header fontSize="lg" fontWeight="bold">
            Fel vid inloggning
          </AlertDialog.Header>
          <AlertDialog.Body>{loginErrorText}</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button ref={cancelRef} onPress={() => setShowLoginError(false)}>
              OK
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Center>
  );
};
