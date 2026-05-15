import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Linking,
  Platform,
} from "react-native";
import * as SecureStore from "@/features/common/services/secureStorage";
import { useRouter } from "expo-router";
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
  const router = useRouter();
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
      await SecureStore.setItem(
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

    <ThemedView style={{ flex: 1, padding: 20, gap: 16, paddingTop: 60 }}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.topContainer}>

        <ThemedText type="title" >
          Välkommen tillbaka!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.instructionText}>
          {loginAsNonMember ? 'Logga in med dina swag.mensa.se-uppgifter' : 'Logga in med dina Mensa.se-uppgifter'}
        </ThemedText>
      </View>

      <ThemedInput
        editable={!isLoading}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <ThemedInput
        editable={!isLoading}
        placeholder="Lösenord"
        autoCapitalize="none"
        autoCorrect={false}
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




      <View style={styles.loginTypeContainer}>
        {loginAsNonMember ? (
          <TouchableOpacity onPress={() => setLoginAsNonMember(false)} style={{ alignItems: "center", justifyContent: "center" }}>
            <ThemedText type="instruction">Medlem i Mensa Sverige?</ThemedText>
            <ThemedText type="link" style={styles.link}>Logga in här</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setLoginAsNonMember(true)} style={{ alignItems: "center", justifyContent: "center" }}>
            <ThemedText type="instruction">Medföljande eller internationell medlem?</ThemedText>
            <ThemedText type="link" style={styles.link}>Logga in här</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {!loginAsNonMember && (
        <View style={styles.resetPasswordContainer}>
          <ThemedText
            type='instruction'
            onPress={() => Linking.openURL("https://medlem.mensa.se/lostpassword")}
            style={styles.link}
          >
            Glömt dina inloggningsuppgifter?
          </ThemedText>
        </View>

      )}

      {Platform.OS === 'web' && (
        <View style={styles.webLinksContainer}>
          <ThemedText type="subtitle" style={styles.downloadTitle}>
            Ladda ner appen
          </ThemedText>
          <View style={styles.downloadLinksRow}>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://apps.apple.com/se/app/mensa-sverige/id6755419896')}
              style={styles.downloadLink}
            >
              <ThemedText type="link" style={styles.downloadLinkText}>
                App Store
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=se.mensasverige')}
              style={styles.downloadLink}
            >
              <ThemedText type="link" style={styles.downloadLinkText}>
                Google Play
              </ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            style={styles.privacyLinkContainer}
          >
            <ThemedText type="link" style={styles.privacyLink}>
              Integritetspolicy
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
};


const styles = StyleSheet.create({
  loginTypeContainer: {
    justifyContent: "center",
    marginTop: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  topContainer: {
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  link: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 8,
  },
  resetPasswordContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  webLinksContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 16,
  },
  downloadTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  downloadLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  downloadLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  downloadLinkText: {
    textAlign: 'center',
    fontSize: 14,
  },
  privacyLinkContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  privacyLink: {
    textAlign: 'center',
    fontSize: 14,
  },
});
