import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Center,
  Input,
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
  View,
  useColorMode,
  Heading,
  InputField,
  ButtonText,
  ButtonIcon,
} from '@gluestack-ui/themed';
import { faPlus, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import useStore from '../../common/store/store';
import * as Keychain from 'react-native-keychain';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import { updateUser } from '../services/userService';
import { ShowLocation } from '../../../api_schema/types';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import { Picker } from '@react-native-picker/picker';
import { Button } from '../../../gluestack-components';

const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const { user, setUser, backendConnection } = useStore();
  const [formState, setFormState] = useState(user);
  const colorMode = useColorMode()
  const styles = createStyles();

  const [isLoading, setIsLoading] = useState(false);

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
          contentContainerStyle={styles.contentContainer}
        >

          <VStack space="md" h="100%" bg="$background0" flex={1} justifyContent="center" alignItems="center">
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
            <Heading> {user.firstName} {user.lastName}</Heading>

          </VStack>

          <Fields heading="Kontaktuppgifter">
            <Field label="E-post ">
              <Input>
                <InputField
                  placeholder="E-post"
                  value={user?.contact_info?.email || ''}
                  onChangeText={(contact_info: string) => {
                    if (!formState) {
                      return;
                    }
                    setFormState({
                      ...formState,
                      contact_info: {
                        ...formState.contact_info,
                        email: contact_info,
                      },
                    });

                  }}
                />
              </Input>
            </Field>
            <Field label="Telefonnummer">
              <Input>
                <InputField
                  placeholder="07x-xxxxxxx"
                  value={user?.contact_info?.phone || ''}
                  onChangeText={(contact_info: string) => {
                    if (!formState) {
                      return;
                    }
                    setFormState({
                      ...formState,
                      contact_info: {
                        ...formState.contact_info,
                        phone: contact_info,
                      },
                    });

                  }}
                />
              </Input>
            </Field>
          </Fields>

          <Fields heading="Kartan">
            <Field label="Visa mina platsuppgifter för">
              <Picker
                selectedValue={formState?.settings?.show_location}
                onValueChange={(itemValue, itemIndex) => {
                  if (!formState || !formState.settings) {
                    return;
                  }
                  setFormState({
                    ...formState,
                    settings: {
                      ...formState.settings,
                      show_location: itemValue,
                    },
                  })
                }

                }
              >
                <Picker.Item label="Ingen" value="no_one" />
                <Picker.Item label="Andra som visar sin position" value="only_members_who_share_their_own_location" />
                <Picker.Item label="Alla" value="only_members" />
                {/* <Picker.Item label="Everyone Who Share Their Own Location" value="everyone_who_share_their_own_location" />
    <Picker.Item label="Everyone" value="everyone" /> */}
              </Picker>
            </Field>
          </Fields>
{/* 
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

         */}
         
        <Button size="md" variant="solid" action="primary" isDisabled={false} isFocusVisible={false}  >
          <ButtonText>Spara 
          {isLoading && (
                  <Spinner
                    color="white"
                    top="10"
                    size="small"
                    accessibilityLabel="Sparar..."
                  />
                )}
          </ButtonText>
          {/* <ButtonIcon as={AddIcon} /> */}
        </Button>
      
        </ScrollView>
        {/* <Button size="sm" onPress={() => handleLogout()}>
              <Text color="white">Logga ut</Text>
            </Button> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const createStyles = () =>
  StyleSheet.create({
    viewContainer: {
      flex: 1,
    },
    contentContainer: {
      padding: 10,
      flexGrow: 1,
    },
  });

export default Profile;
