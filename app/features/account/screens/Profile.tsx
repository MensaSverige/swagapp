import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Center,
  Input,
  Button,
  VStack,
  Text,
  Image,
  ScrollView,
  Switch,
  Spinner,
  Icon,
  useTheme,
  Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger, ChevronDownIcon,
  HStack,
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  Box,
  View
} from '@gluestack-ui/themed';
import { User } from 'lucide-react-native';
import { faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import useStore from '../../common/store/store';
import * as Keychain from 'react-native-keychain';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import { updateUser } from '../services/userService';
import { ShowLocation } from '../../../api_schema/types';
import {gluestackUIConfig} from '../../../gluestack-components/gluestack-ui.config';
import { useColorMode } from '@gluestack-ui/themed';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const { user, setUser, backendConnection } = useStore();
  const colorMode = useColorMode()
  //const styles = createStyles();

  //Local state for form fields
  const [showLocation, setShowLocation] = useState(
    user?.settings.show_location || ShowLocation.NoOne,
  );
  const [showContactInfo, setShowContactInfo] = useState(
    user?.settings.show_contact_info || false,
  );
  const [email, setEmail] = useState(user?.contact_info?.email || '');
  const [phone, setPhone] = useState(user?.contact_info?.phone || '');

  const [isLoading, setIsLoading] = useState(false);
  const [avararChanged, setAvatarChanged] = useState(false);

  const handleLogout = () => {
    Keychain.resetGenericPassword({ service: 'credentials' });
    Keychain.resetGenericPassword({ service: 'refreshToken' });
    Keychain.resetGenericPassword({ service: 'accessToken' });
    setUser(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (!user) {
      return;
    }

    // updateUser(user)
    //   .then(returnedUser => {
    //     setUser({ ...user, ...returnedUser });
    //   })
    //   .catch(error => {
    //     console.error('Error updating user', error);
    //   })
    //   .finally(() => {
    //     setIsLoading(false);
    //     setAvatarChanged(false);
    //   });
  };

  if (!user) {
    return null;
  }

  return (
    //<SafeAreaView style={styles.viewContainer}>
    <SafeAreaView key={colorMode}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 0}>
        <ScrollView bg="$background0"
          w="100%"
          h="100%"
        // contentContainerStyle={styles.contentContainer}
        >
          <HStack space="md" h="100%" bg="$background0" flex={1} justifyContent="center" alignItems="center">

            <Center pt={10}>

              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  alt="Profile image"
                  size="md"
                  style={{ width: 160, height: 160, borderRadius: 80 }}
                />
              ) : (
                <View style={{
                  backgroundColor: gluestackUIConfig.tokens.colors.blue700, 
                  borderRadius: 80,
                  width: 160,
                  height: 160,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <FontAwesomeIcon
                    icon={faUser}
                    size={100}
                    color="white"
                  />
                </View>
              )}
              <View style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                backgroundColor: 'white',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <FontAwesomeIcon
                  icon={faPlus}
                  size={15}
                  color={gluestackUIConfig.tokens.colors.blue700}
                />
              </View>
            </Center>
          </HStack>


        </ScrollView>
        {/* <ScrollView
          w="100%"
          h="100%"
          // contentContainerStyle={styles.contentContainer}
          >
          <Center pt={10}>
            {!avararChanged && user.avatar_url && (
              <Image
                source={{ uri: user.avatar_url }}
                alt="Profile image"
                size="md"
                borderRadius={100}
              />
            )}
          </Center> */}
        {/* 
          <Fields heading="Profilbild">
            <Field
              label="Adress till profilbild"
              help="Visas på kartan och i evenemang du skapar">
              <Input
                placeholder="https://example.com/avatar.png"
                value={user.avatar_url || ''}
                onChangeText={(avatar_url: string) => {
                  setUser({ ...user, avatar_url });
                  setAvatarChanged(true);
                }}
              />
            </Field>
          </Fields> */}

        {/* <Fields heading="Kartan">
            <Field label="Visa position" help="Visa din position på kartan">
              <Switch
                isChecked={showLocation}
                onToggle={show_location => {
                  setShowLocation(show_location);
                }}
                accessibilityLabel="Visa min position på kartan"
              />
            </Field>
            <Select>
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Select option" />
                <SelectIcon mr="$3">
                  <Icon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>

                </SelectContent>
              </SelectPortal>
            </Select>

            <Field label="Visa kontaktuppgift">
              <Switch
                isChecked={showContactInfo}
                onToggle={show_contact_info => {
                  setShowContactInfo(show_contact_info);
                }}
                accessibilityLabel="Visa mina kontaktuppgifter på kartan"
              />
            </Field>
            <Field label="Kontaktuppgifter ">
              <Input
                placeholder="E-post"
                value={user?.contact_info?.email || ''}
                onChangeText={(contact_info: string) => {
                  setContactInfo(contact_info);
                }}
              />
            </Field>
          </Fields> */}
        {/* <Fields>
            <Button onPress={handleSave} isDisabled={!backendConnection}>
              <Text color="white">
                Spara
                {isLoading && (
                  <Spinner
                    color="white"
                    top="10"
                    size="small"
                    accessibilityLabel="Sparar..."
                  />
                )}
              </Text>
            </Button>
          </Fields> */}
        {/* <VStack mt={10}>
            <Text>Du är inloggad som {user.firstName} {user.lastName}</Text>
            <Button size="sm" onPress={() => handleLogout()}>
              <Text color="white">Logga ut</Text>
            </Button>
          </VStack>
        </ScrollView> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

//const createStyles = (theme: ICustomTheme) =>
// const createStyles = () =>
//   StyleSheet.create({
//     viewContainer: {
//       flex: 1,
//       //backgroundColor: theme.colors.background[500],
//     },
//     contentContainer: {
//       padding: 10,
//       flexGrow: 1,
//     },
//   });

export default Profile;
