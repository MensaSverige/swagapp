import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import useStore from "../../common/store/store";
//import { TEST_MODE } from "@env";
import { authenticate } from "../../common/services/authService";
import { tryGetCurrentUser } from "../services/userService";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedInput } from "@/components/ThemedInput";
import { ThemedButton } from "@/components/ThemedButton";
import { SaveCredentialsCheckBox } from "@/features/common/components/SaveCredentialsCheckBox";

export const SigninForm = () => {
  // const colorMode = useColorMode();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [loginAsNonMember, setLoginAsNonMember] = useState(false);
  const [loginErrorText, setLoginErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTryingStoredCredentials, setIsTryingStoredCredentials] =
    useState(false);
  const { testMode, backendConnection, user, setUser, setIsTryingToLogin } =
    useStore();

  const showLoginError = (errorText: string) => {
    Alert.alert(
      "Fel vid inloggning",
      errorText,
      [{ text: "OK", style: "default" }],
      { cancelable: false }
    );
  };
  useEffect(() => {
    if (!user && backendConnection) {
      setIsLoading(true);
      tryGetCurrentUser()
        .then((response) => {
          console.log('Current user response', response);
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

  const saveCreds = async (key: "credentials" | "non-member-credentials") => {
    console.log(`Saving credentials username and password for ${key}`);
    if (!saveCredentials) return;
    try {
      await SecureStore.setItemAsync(
        key,
        JSON.stringify({ username, password })
      );
    } catch (error) {
      console.error("Save credentials error", error);
      showLoginError(
        "Något gick fel. Kunde inte spara dina inloggningsuppgifter."
      );
    }
  };

  const handleMemberLogin = async () => {
    await saveCreds("credentials");
    setIsLoading(true);
    authenticate(username, password, testMode, true)
      .then((response) => {
        console.log('Member login response', response.user);
        if (response !== undefined) setUser(response.user);
      })
      .catch((error) => {
        console.error("Login error", error.message || error);
        if (error.message.includes("Network Error")) {
          showLoginError(
            `Det går inte att nå servern just nu. ${isTryingStoredCredentials ? "Försöker igen automatiskt" : "Försök igen om en stund."}`,
          );
        } else {
          showLoginError("Något gick fel. Försök igen senare.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleNonMemberLogin = async () => {
    await saveCreds("non-member-credentials");
    setIsLoading(true);
    authenticate(username, password, testMode, false)
      .then((response) => {
        if (response !== undefined) setUser(response.user);
      })
      .catch((error) => {
        console.error("Login error", error.message || error);
        if (error.message.includes("Network Error")) {
          showLoginError(
            `Det går inte att nå servern just nu. ${isTryingStoredCredentials ? "Försöker igen automatiskt" : "Försök igen om en stund."}`,
          );
        } else {
          showLoginError("Något gick fel. Försök igen senare.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onSubmit = () => {
    if (loginAsNonMember) handleNonMemberLogin();
    else handleMemberLogin();
  };

  return (
    <ParallaxScrollView>
      <ThemedView>
        <ThemedText type="title">Välkommen Swagger</ThemedText>


        <ThemedText type="defaultSemiBold">
          {loginAsNonMember ? 'Logga in med dina swag.mensa.se-uppgifter' : 'Logga in med dina Mensa.se-uppgifter'}
        </ThemedText>

        <ThemedInput
          editable={!isLoading}
          placeholder="Email"
          keyboardType="email-address"
          value={username}
          onChangeText={setUsername}
        />
        <ThemedInput
          editable={!isLoading}
          placeholder="Lösenord"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          showPasswordToggle={true}
          onPasswordToggle={() => setPasswordVisible(!passwordVisible)}
        />
        <SaveCredentialsCheckBox
          value={saveCredentials}
          onValueChange={setSaveCredentials}
        />

        <ThemedButton
          text={loginAsNonMember ? "Logga in som medföljande" : "Logga in"}
          disabled={!backendConnection}
          isLoading={isLoading}
          onPress={onSubmit}
          variant={loginAsNonMember ? "secondary" : "primary"}
          style={{
            opacity: backendConnection ? 1 : 0.5,
          }}
        />




      </ThemedView>
    </ParallaxScrollView>
  );
};


const styles = StyleSheet.create({

  stack: { marginTop: 16, gap: 14, flex: 1 },
  loadingWrap: { flexDirection: "row", marginTop: 24, justifyContent: "center", alignItems: "center", flex: 1 },
});
