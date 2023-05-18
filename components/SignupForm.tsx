import {
  Box,
  Button,
  Center,
  FormControl,
  Heading,
  Input,
  VStack,
} from 'native-base';
import React from 'react';

export const SignupForm = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

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
        }),
      });

      if (response.ok) {
        // Login was successful.
        const data = await response.text();
        console.log(data);
      } else {
        // Something went wrong with the login.
        console.error('Login failed.');
      }
    } catch (error) {
      // An error occurred while trying to log in.
      console.error(error);
    }
  };

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
    </Center>
  );
};
