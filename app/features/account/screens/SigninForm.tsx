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
} from "native-base";
import React, { useEffect, useState, useRef } from "react";
import useStore from "../../common/store/store";
import * as Keychain from "react-native-keychain";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { TEST_MODE } from "@env";
import { authenticate } from "../../common/services/authService";
import { tryGetCurrentUser } from "../../account/services/userService";
import { AuthResponse, User } from "../../../api_schema/types";
export const SigninForm = () => {
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorText, setLoginErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTryingStoredCredentials, setIsTryingStoredCredentials] =
    useState(false);
  const { testMode, backendConnection, user, setUser, setIsTryingToLogin } =
    useStore();
  useEffect(() => {
    if (!user && backendConnection) {
      tryGetCurrentUser()
        .then((response) => {
          if (response !== undefined) setUser(response.user);
        })
        .catch((error) => {
          // Handle error
        })
        .finally(() => {
          setIsLoading(false);
          setIsTryingToLogin(false);
        });
    }
  }, [user, backendConnection]);
  const handleLogin = async () => {
    try {
      if (saveCredentials) {
        Keychain.setGenericPassword(username, password, {
          service: "credentials",
        });
      }
    } catch (error) {
      console.error("Save credentials error", error);
      setLoginErrorText(
        "Något gick fel. Kunde inte spara dina inloggningsuppgifter.",
      );
      setShowLoginError(true);
    }
    setIsLoading(true);
    authenticate(username, password, testMode)
      .then((response) => {
        if (response !== undefined) setUser(response.user);
      })
      .catch((error) => {
        console.error("Login error", error.message || error);
        if (error.message.includes("Network Error")) {
          setLoginErrorText(
            `Det går inte att nå servern just nu. ${isTryingStoredCredentials ? "Försöker igen automatiskt" : "Försök igen om en stund."}`,
          );
        } else {
          setLoginErrorText("Något gick fel. Försök igen senare.");
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
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChangeText={setPassword}
            isDisabled={isLoading}
            InputRightElement={
              <Button
                ml={1}
                bg="transparent"
                roundedLeft={0}
                roundedRight="md"
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
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
              isDisabled={!backendConnection}
            >
              {TEST_MODE ? "Logga in" : "Logga in i testläge"}
            </Button>
          )}
        </VStack>
        <AlertDialog
          leastDestructiveRef={cancelRef}
          isOpen={showLoginError}
          onClose={() => {
            setShowLoginError(false);
          }}
        >
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
