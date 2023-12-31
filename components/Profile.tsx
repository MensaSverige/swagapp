import React, {useState} from 'react';
import {
  Center,
  Input,
  Button,
  VStack,
  Text,
  Image,
  ScrollView,
  Switch,
  Spinner,
  KeyboardAvoidingView,
  ICustomTheme,
  useTheme,
} from 'native-base';
import apiClient from '../apiClient';
import useStore from '../store/store';
import * as Keychain from 'react-native-keychain';
import {User} from '../types/user';
import Field from './Field';
import Fields from './Fields';
import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import {omitUndefined} from 'native-base/lib/typescript/theme/v33x-theme/tools';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const {user, setUser} = useStore();

  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);

  // Local state for form fields
  const [showLocation, setShowLocation] = useState(user?.show_location);
  const [showContactInfo, setShowContactInfo] = useState(
    user?.show_contact_info,
  );
  const [contactInfo, setContactInfo] = useState(user?.contact_info);

  const [isLoading, setIsLoading] = useState(false);
  const [avararChanged, setAvatarChanged] = useState(false);

  const handleLogout = () => {
    Keychain.resetGenericPassword({service: 'credentials'});
    Keychain.resetGenericPassword({service: 'refreshToken'});
    Keychain.resetGenericPassword({service: 'accessToken'});
    setUser(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (!user) {
      return;
    }

    return apiClient
      .put('/user/' + user.id, {
        ...user,
        show_location: showLocation,
        show_contact_info: showContactInfo,
        contact_info: contactInfo,
      })
      .then(response => {
        if (response.status === 200 && response.data.status === 'success') {
          const returnedUser = response.data.data as User;
          setUser({
            ...user,
            avatar_url: returnedUser.avatar_url,
            show_location: returnedUser.show_location,
          });
        }
      })
      .catch(error => {
        console.error('Failed to update profile:', error.message || error);
      })
      .finally(() => {
        setIsLoading(false);
        setAvatarChanged(false);
      });
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.viewContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 0}>
        <ScrollView
          w="100%"
          h="100%"
          contentContainerStyle={styles.contentContainer}>
          <Center pt={10}>
            {!avararChanged && (
              <Image
                source={{uri: user.avatar_url}}
                alt="Profile image"
                size={150}
                borderRadius={100}
              />
            )}
          </Center>

          <Fields heading="Profilbild">
            <Field
              label="Adress till profilbild"
              help="Visas på kartan och i evenemang du skapar">
              <Input
                placeholder="https://example.com/avatar.png"
                value={user.avatar_url}
                onChangeText={(avatar_url: string) => {
                  setUser({...user, avatar_url});
                  setAvatarChanged(true);
                }}
              />
            </Field>
          </Fields>

          <Fields heading="Kartan">
            <Field label="Visa position" help="Visa din position på kartan">
              <Switch
                isChecked={showLocation}
                onToggle={show_location => {
                  setShowLocation(show_location);
                }}
                accessibilityLabel="Visa min position på kartan"
              />
            </Field>
            <Field label="Visa kontaktuppgift">
              <Switch
                isChecked={showContactInfo}
                onToggle={show_contact_info => {
                  setShowContactInfo(show_contact_info);
                }}
                accessibilityLabel="Visa mina kontaktuppgifter på kartan"
              />
            </Field>
            <Field label="Kontaktuppgift">
              <Input
                placeholder="Telefonnummer eller e-post"
                value={contactInfo}
                onChangeText={(contact_info: string) => {
                  setContactInfo(contact_info);
                }}
              />
            </Field>
          </Fields>
          <Fields>
            <Button onPress={handleSave}>
              <Text color="white">
                Spara
                {isLoading && (
                  <Spinner
                    color="white"
                    top="10"
                    size="sm"
                    accessibilityLabel="Sparar..."
                  />
                )}
              </Text>
            </Button>
          </Fields>
          <VStack space={4} mt={10}>
            <Text>Du är inloggad som {user.username}</Text>
            <Button size="sm" onPress={() => handleLogout()}>
              <Text color="white">Logga ut</Text>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ICustomTheme) =>
  StyleSheet.create({
    viewContainer: {
      flex: 1,
      backgroundColor: theme.colors.background[500],
    },
    contentContainer: {
      padding: 10,
      flexGrow: 1,
    },
  });

export default Profile;
