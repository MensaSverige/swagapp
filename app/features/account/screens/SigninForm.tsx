import React, { useEffect, useState, useRef } from "react";
import useStore from "../../common/store/store";
import * as Keychain from "react-native-keychain";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faClose, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { TEST_MODE } from "@env";
import { authenticate } from "../../common/services/authService";
import { tryGetCurrentUser } from "../services/userService";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  InputSlot,
  InputIcon,
  Heading,
  Input,
  Spinner,
  Text, Button, ButtonText, HStack, Pressable, SafeAreaView, VStack,
  InputField,
  Modal,
  ModalContent,
  ModalCloseButton,
  ModalBackdrop,
  ModalHeader,
  ModalBody,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  Box
} from "../../../gluestack-components";
import { Link, ModalFooter, useColorMode } from '@gluestack-ui/themed';
import { LoadingScreen } from '../../common/screens/LoadingScreen';
import { config } from "../../../gluestack-components/gluestack-ui.config";
import { Touchable, TouchableOpacity } from "react-native";
import { Spacer } from "@gluestack-ui/themed-native-base";

export const SigninForm = () => {
  const colorMode = useColorMode();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [loginAsNonMember, setLoginAsNonMember] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorText, setLoginErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTryingStoredCredentials, setIsTryingStoredCredentials] =
    useState(false);
  const { testMode, backendConnection, user, setUser, setIsTryingToLogin } =
    useStore();
  useEffect(() => {
    if (!user && backendConnection) {
      setIsLoading(true);
      tryGetCurrentUser()
        .then((response) => {
          if (response?.user !== undefined) {
            setUser(response.user);
          }
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

  const handleMemberLogin = async () => {
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
    authenticate(username, password, testMode, true)
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

  const handleNonMemberLogin = async () => {
    try {
      if (saveCredentials) {
        Keychain.setGenericPassword(username, password, {
          service: "non-member-credentials",
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
    authenticate(username, password, testMode, false)
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
    <SafeAreaView flex={1} key={colorMode}>
      <VStack flex={1} bg="$background0" space="lg" padding={20}>
        <Heading size="lg">Välkommen Swagger</Heading>

        <VStack flex={1} space="lg" mt={5}>

          <Heading fontWeight="medium" size="xs">
            {loginAsNonMember ? 'Logga in med dina swag.mensa.se-uppgifter' : 'Logga in med dina Mensa.se-uppgifter'}
          </Heading>

          <Input
            variant="outline"
            isDisabled={isLoading}
            height={48}
          >
            <InputField
              placeholder="Email"
              keyboardType="email-address"
              value={username}
              onChangeText={setUsername}
              height={48}
            />
          </Input>
          <Input
            variant="outline"
            isDisabled={isLoading}
            height={48}
          >
            <InputField
              placeholder="Lösenord"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              height={48}
            />
            <InputSlot pr="$3" onPress={() => {
              setPasswordVisible((passwordVisible) => {
                return !passwordVisible
              })
            }}>
              <InputIcon
                as={passwordVisible ? EyeIcon : EyeOffIcon}
                color="$primary500"
              />
            </InputSlot>
          </Input>
          <TouchableOpacity onPress={() => {setSaveCredentials(!saveCredentials)}}>
            <Checkbox aria-label="Save Credentials" size="md" isInvalid={false} isDisabled={false} onChange={setSaveCredentials} value={saveCredentials.toString()} height={48} paddingHorizontal={5}>
              <CheckboxIndicator mr="$2">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel>Spara inloggning</CheckboxLabel>
            </Checkbox>
          </TouchableOpacity>

          <VStack space="lg" flex={1}>
            {isLoading ? (
              <LoadingScreen/>
            ) : (
              <>
                <Button
                  size="md"
                  height={48}
                  variant="solid"
                  action="primary"
                  onPress={() => {
                    if (loginAsNonMember) {
                      handleNonMemberLogin();
                    } else {
                      handleMemberLogin();
                    }
                  }}
                  isDisabled={!backendConnection}
                >
                  <ButtonText style={{ textAlign: 'center' }}> {TEST_MODE ? (loginAsNonMember ? "Logga in som medföljande" : "Logga in") : "Logga in i testläge"} </ButtonText>
                </Button>
                <Box flex={1} paddingTop={40} alignItems="center">
                  {loginAsNonMember ? (
                    <>
                      <Link onPress={() => setLoginAsNonMember(false)} alignItems="center" height={48}>
                        <Text size="sm">Medlem i Mensa Sverige?</Text>
                        <Text size="sm" color="$primary700">Logga in här</Text>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link onPress={() => setLoginAsNonMember(true)} alignItems="center" height={48}>
                        <Text size="sm">Medföljande eller internationell medlem?</Text>
                        <Text size="sm" color="$primary700">Logga in här</Text>
                      </Link>
                    </>
                  )}
                </Box>
              </>
            )}
          </VStack>
          <Box flex={1} />
        </VStack>
        <Modal
          isOpen={showLoginError}
          onClose={() => setShowLoginError(false)}
          finalFocusRef={cancelRef}
          size='lg'
        >
          <ModalBackdrop bg="$coolGray500" />
          <ModalContent >
            <ModalHeader>
              <Heading size="lg">Fel vid inloggning</Heading>
              <ModalCloseButton>
                <FontAwesomeIcon icon={faClose} size={20} style={{ color: config.tokens.colors.blue400, }} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Text>{loginErrorText}</Text>
            </ModalBody>
            <ModalFooter >
              <HStack space="lg" justifyContent="center" alignItems="center" padding={20}>
                <Button
                  size="md"
                  variant="solid"
                  action="primary"
                  isDisabled={false}
                  isFocusVisible={false}
                  onPress={() => setShowLoginError(false)}
                >
                  <ButtonText style={{ textAlign: 'center' }}>OK</ButtonText>
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </SafeAreaView>
  );
};
