import React, { useEffect, useState } from 'react';
import {
  useColorMode,
  useTheme,
} from '@gluestack-ui/themed';
import {
  Button,
  KeyboardAvoidingView, Center,
  Input,
  VStack,
  Text,
  Image,
  ScrollView,
  Switch,
  Spinner,
  Icon,
  Select, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper, SelectIcon, SelectInput, SelectItem, SelectPortal, SelectTrigger, ChevronDownIcon,
  HStack,
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  Box,
  View,
  Heading,
  InputField,
  ButtonText,
  ButtonIcon,
  Card,
  useToast,
} from '../../../gluestack-components';
import { faPlus, faUser, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import useStore from '../../common/store/store';
import * as Keychain from 'react-native-keychain';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import { Platform, SafeAreaView, StyleSheet } from 'react-native';
import { updateUser } from '../services/userService';
import { User, UserUpdate } from '../../../api_schema/types';
import { gluestackUIConfig } from '../../../gluestack-components/gluestack-ui.config';
import { Picker } from '@react-native-picker/picker';
import SettingsSwitchField from '../../common/components/SettingsSwitchField';
import ShowSettingsLabelIconColor from '../../common/components/ShowSettingsLabelIconColor';
import ShowSettingsLabelIcon from '../../common/components/ShowSettingsLabelIcon';
import AutosaveSuccessToast from '../../common/components/AutosaveSuccessToast';
import AutosaveErrorToast from '../../common/components/AutosaveErrorToast';
import AutosaveToast from '../../common/components/AutosaveToast';


const Profile: React.FC = () => {
  // Get current user and token from Zustand store
  const { user, setUser, backendConnection } = useStore();
  const getFormStateFromUser = (user: User) => ({
    contact_info: {
      email: user?.contact_info?.email || '',
      phone: user?.contact_info?.phone || '',
    },
    settings: {
      show_email: user?.settings?.show_email || false,
      show_phone: user?.settings?.show_phone || false,
      show_location: user?.settings?.show_location || 'no_one',
    },
  });
  const [formState, setFormState] = useState<UserUpdate>(getFormStateFromUser(user as User));

  const colorMode = useColorMode()
  const theme = useTheme();
  const toast = useToast();
  const styles = createStyles();

  const [isLoading, setIsLoading] = useState(false);
  const [locationSwitch, setLocationSwitch] = useState<boolean>(formState?.settings?.show_location === 'no_one' ? false : true);
  const [isEditing, setIsEditing] = useState(false);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };
  const handleLogout = () => {
    Keychain.resetGenericPassword({ service: 'credentials' });
    Keychain.resetGenericPassword({ service: 'refreshToken' });
    Keychain.resetGenericPassword({ service: 'accessToken' });
    setUser(null);
  };

  useEffect(() => {
    
    if (!formState || isEditing) {
      return;
    }
    autosave(formState as User)?.then((returnedUser) => {
      setUser({ ...user, ...returnedUser });
    }
    );
  }, [formState, isEditing]);

  const autosave = (formState: User): Promise<User> | undefined => {
    if (!user || JSON.stringify(getFormStateFromUser(user)) === JSON.stringify(formState)) {
      return;
    }
    toast.closeAll();
    toast.show({
      placement: "bottom",
      duration: 1000,
      render: ({ id }) => (
        <AutosaveToast
          id={id}
        />
      ),
    });
    setTimeout(() => {
      if (!user) {
        return;
      }
      updateUser(formState as UserUpdate)
        .then(returnedUser => {
          setUser({ ...user, ...returnedUser });
          toast.closeAll();
          toast.show({
            placement: "bottom",
            duration: 1000,
            render: ({ id }) => (
              <AutosaveSuccessToast
                id={id}
              />
            ),
          });
          return returnedUser;
        })
        .catch(error => {
          console.error('Error updating user', error);
          toast.closeAll();
          toast.show({
            placement: "bottom",
            duration: 3000,
            render: ({ id }) => (
              <AutosaveErrorToast
                id={id}
              />
            ),
          });
        })
        .finally(() => {
        });
    }, 1000); // Delay of 1 second
    
  }

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
          <VStack space="lg" h="100%" bg="$background0" flex={1} >
            <Fields heading="Kontaktuppgifter">
              <Card size="sm" variant="elevated" m="$0">
                <Field label="E-post "
                  labelIcon={ShowSettingsLabelIcon(formState?.settings?.show_email)}
                  labelIconColor={ShowSettingsLabelIconColor(formState?.settings?.show_email)}
                >
                  <Text>{user?.contact_info?.email || ''}</Text>
                </Field>
              </Card>
              <Card size="sm" variant="elevated" m="$0">
                <Field label="Telefonnummer"
                  labelIcon={ShowSettingsLabelIcon(formState?.settings?.show_phone)}
                  labelIconColor={ShowSettingsLabelIconColor(formState?.settings?.show_phone)}>
                  <Input>
                    <InputField
                      keyboardType="numeric"
                      placeholder="07xxxxxxxx"
                      value={formState?.contact_info?.phone || ''}
                      onFocus={handleFocus}
                      onChangeText={(phone: string) => {
                        const numericPhone = phone.replace(/[^0-9]/g, '');
                        if (!formState || !formState.contact_info) {
                          return;
                        }
                        setFormState({
                          ...formState,
                          contact_info: {
                            ...formState.contact_info,
                            phone: numericPhone,
                          },
                        });
                      }}
                      onBlur={handleBlur}
                    />
                  </Input>
                </Field>
              </Card>
            </Fields>

            <Fields heading="Sekretess">
              <Card size="sm" variant="elevated" m="$0">
                <SettingsSwitchField
                  label="Visa e-post"
                  value={formState?.settings?.show_email || false}
                  onValueChange={(value) => {
                    if (!formState || !formState.settings) {
                      return;
                    }
                    setFormState({
                      ...formState,
                      settings: {
                        ...formState.settings,
                        show_email: value,
                      },
                    });
                  }}
                />
              </Card>
              <Card size="sm" variant="elevated" m="$0">
                <SettingsSwitchField
                  label="Visa telefonnummer"
                  value={formState?.settings?.show_phone || false}
                  onValueChange={(value) => {
                    if (!formState || !formState.settings) {
                      return;
                    }
                    setFormState({
                      ...formState,
                      settings: {
                        ...formState.settings,
                        show_phone: value,
                      },
                    });
                  }}
                />
              </Card>
              <Card size="sm" variant="elevated" m="$0">
                <SettingsSwitchField
                  label="Visa platsuppgifter"
                  value={locationSwitch}
                  onValueChange={(value) => {
                    if (!formState || !formState.settings) {
                      return;
                    }
                    setLocationSwitch(value);
                    if (value) {
                      setFormState({
                        ...formState,
                        settings: {
                          ...formState.settings,
                          show_location: 'only_members_who_share_their_own_location',
                        },
                      });
                    } else {
                      setFormState({
                        ...formState,
                        settings: {
                          ...formState.settings,
                          show_location: 'no_one',
                        },
                      });
                    }
                  }}
                />
                {locationSwitch && (
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
                    onBlur={handleBlur}
                  >
                    <Picker.Item label="Visa för andra som visar sin position" value="only_members_who_share_their_own_location" />
                    <Picker.Item label="Visa för alla" value="only_members" />
                  </Picker>
                )}
              </Card>
            </Fields>
          </VStack>
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
