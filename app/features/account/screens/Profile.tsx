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
import useStore from '../../common/store/store';
import * as Keychain from 'react-native-keychain';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import {Platform, SafeAreaView, StyleSheet} from 'react-native';
import {updateUser} from '../services/userService';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const {user, setUser} = useStore();

  const theme = useTheme() as ICustomTheme;
  const styles = createStyles(theme);

  // Local state for form fields
  const [showLocation, setShowLocation] = useState(user?.show_location || false);
  const [showContactInfo, setShowContactInfo] = useState(
    user?.show_contact_info || false,
  );
  const [contactInfo, setContactInfo] = useState(user?.contact_info || '');

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

    updateUser(user, showLocation, showContactInfo, contactInfo).then((returnedUser) => { 
      setUser({
        ...user,
        avatar_url: returnedUser?.avatar_url,
        show_location: returnedUser?.show_location,
      });
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
            {!avararChanged && user.avatar_url && (
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
