import React, { useEffect, useMemo, useState } from 'react';
import { useColorMode } from '@gluestack-ui/themed';
import {
    KeyboardAvoidingView,
    Input,
    VStack,
    Text,
    ScrollView,
    Heading,
    InputField,
    Card,
    useToast,
    Divider,
    Button,
    ButtonText,
} from '../../../gluestack-components';
import useStore from '../../common/store/store';
import Field from '../../common/components/Field';
import Fields from '../../common/components/Fields';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StyleSheet,
} from 'react-native';
import { updateUser } from '../services/userService';
import { ShowLocation, User, UserUpdate } from '../../../api_schema/types';
import { Picker } from '@react-native-picker/picker';
import SettingsSwitchField from '../../common/components/SettingsSwitchField';
import ShowSettingsLabelIconColor from '../../common/components/ShowSettingsLabelIconColor';
import ShowSettingsLabelIcon from '../../common/components/ShowSettingsLabelIcon';
import AutosaveSuccessToast from '../../common/components/AutosaveSuccessToast';
import AutosaveErrorToast from '../../common/components/AutosaveErrorToast';
import AutosaveToast from '../../common/components/AutosaveToast';
import { resetUserCredentials } from '../../common/services/authService';
import ProfileEditAvatar from '../../common/components/ProfileEditAvatar';
import { extractNumericValue } from '../../common/functions/extractNumericValue';

const UserSettings: React.FC = () => {
    const { user, setUser } = useStore();
    const getFormStateFromUser = (user: User) => ({
        contact_info: {
            email: user?.contact_info?.email || '',
            phone: user?.contact_info?.phone || '',
        },
        settings: {
            show_email: user?.settings?.show_email || false,
            show_phone: user?.settings?.show_phone || false,
            show_location: user?.settings?.show_location || 'NO_ONE',
        },
    });
    const [formState, setFormState] = useState<UserUpdate>(
        getFormStateFromUser(user as User),
    );

    const colorMode = useColorMode();
    const toast = useToast();
    const styles = createStyles();

    const [isLoading, setIsLoading] = useState(false);
    const [locationSwitch, setLocationSwitch] = useState<boolean>(
        formState?.settings?.show_location === 'NO_ONE' ? false : true,
    );
    const [isEditing, setIsEditing] = useState(false);

    const handleFocus = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
    };

    function handleLogout(): void {
        setIsLoading(true);
        resetUserCredentials()
            .then(() => {
                setUser(null);
            })
            .catch(error => console.error('Error logging out', error))
            .finally(() => {
                setIsLoading(false);
            });
    }

    useEffect(() => {
        if (!formState || isEditing) {
            return;
        }
        autosave(formState as User)?.then(returnedUser => {
            setUser({ ...user, ...returnedUser });
        });
    }, [formState, isEditing]);
    type ToastType = 'save' | 'saved' | 'error';

    const showToast = (type: ToastType) => {
        let content;
        switch (type) {
            case 'save':
                content = <AutosaveToast id="save" />;
                break;
            case 'saved':
                content = <AutosaveSuccessToast id="saved" />;
                break;
            case 'error':
                content = <AutosaveErrorToast id="error" />;
                break;
        }

        toast.closeAll();
        toast.show({
            placement: 'bottom',
            duration: 1000,
            render: () => content,
        });
    };
    const autosave = (formState: User): Promise<User> | undefined => {
        if (
            !user ||
            JSON.stringify(getFormStateFromUser(user)) ===
                JSON.stringify(formState)
        ) {
            return;
        }
        showToast('save');

        if (!user) {
            return;
        }
        updateUser(formState as UserUpdate)
            .then(returnedUser => {
                setUser({ ...user, ...returnedUser });
                showToast('saved');
                return returnedUser;
            })
            .catch(error => {
                console.error('Error updating user', error);
                showToast('error');
            })
            .finally(() => {});
    };

    if (!user) {
        return null;
    }

    const locationSharingOptions: {value: ShowLocation, label: string}[] = useMemo(() => user.isMember ? [
        // Members can choose between all options
        {value: "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra medlemmar som visar sin position"},
        {value:                              "ALL_MEMBERS", label: "Alla medlemmar"},
        // {value:    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra deltagare som visar sin position"},
        // {value:                                 "EVERYONE", label: 'Alla'},
    ] : [
        // Non-members can only choose between non member specific options
        {value:    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: 'Andra deltagare som visar sin position'},
        {value:                                 "EVERYONE", label: 'Alla'},
    ], [user.isMember]);

    return (
        //<SafeAreaView style={styles.viewContainer}>
        <SafeAreaView key={colorMode}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 0}>
                <ScrollView
                    bg="$background0"
                    w="100%"
                    h="100%"
                    contentContainerStyle={styles.contentContainer}>
                    <VStack
                        space="md"
                        h="100%"
                        bg="$background0"
                        flex={1}
                        justifyContent="center"
                        alignItems="center">
                        <ProfileEditAvatar
                            colorMode={colorMode}
                            onError={error => {
                                showToast('error');
                            }}
                            onSaved={() => {
                                console.log('saved recieved');
                                showToast('saved');
                            }}
                            onSaving={() => {
                                showToast('save');
                            }}
                        />
                        <Heading>
                            {' '}
                            {user.firstName} {user.lastName}
                        </Heading>
                    </VStack>
                    <VStack space="lg" h="100%" bg="$background0" flex={1}>
                        <Fields heading="Kontaktuppgifter">
                            <Card size="sm" variant="elevated" m="$0">
                                <Field
                                    label="E-post "
                                    labelIcon={ShowSettingsLabelIcon(
                                        formState?.settings?.show_email,
                                    )}
                                    labelIconColor={ShowSettingsLabelIconColor(
                                        formState?.settings?.show_email,
                                    )}>
                                    <Text>
                                        {user?.contact_info?.email || ''}
                                    </Text>
                                </Field>
                            </Card>
                            <Card size="sm" variant="elevated" m="$0">
                                <Field
                                    label="Telefonnummer"
                                    labelIcon={ShowSettingsLabelIcon(
                                        formState?.settings?.show_phone,
                                    )}
                                    labelIconColor={ShowSettingsLabelIconColor(
                                        formState?.settings?.show_phone,
                                    )}>
                                    <Input>
                                        <InputField
                                            keyboardType="numeric"
                                            placeholder="07xxxxxxxx"
                                            value={
                                                formState?.contact_info
                                                    ?.phone || ''
                                            }
                                            onFocus={handleFocus}
                                            onChangeText={(phone: string) => {
                                                if (
                                                    !formState ||
                                                    !formState.contact_info
                                                ) {
                                                    return;
                                                }
                                                setFormState({
                                                    ...formState,
                                                    contact_info: {
                                                        ...formState.contact_info,
                                                        phone:
                                                            extractNumericValue(
                                                                phone,
                                                            ) || '',
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
                                    value={
                                        formState?.settings?.show_email || false
                                    }
                                    onValueChange={value => {
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
                                    value={
                                        formState?.settings?.show_phone || false
                                    }
                                    onValueChange={value => {
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
                                    onValueChange={value => {
                                        if (!formState || !formState.settings) {
                                            return;
                                        }
                                        setLocationSwitch(value);
                                        if (value) {
                                            setFormState({
                                                ...formState,
                                                settings: {
                                                    ...formState.settings,
                                                    show_location: user.isMember ? 'ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION' : 'EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION',
                                                },
                                            });
                                        } else {
                                            setFormState({
                                                ...formState,
                                                settings: {
                                                    ...formState.settings,
                                                    show_location: 'NO_ONE',
                                                },
                                            });
                                        }
                                    }}
                                />
                                {locationSwitch && (
                                    <Picker
                                        prompt='Visa platsuppgifter för...'
                                        selectedValue={
                                            formState?.settings?.show_location
                                        }
                                        onValueChange={(
                                            itemValue,
                                            itemIndex,
                                        ) => {
                                            if (
                                                !formState ||
                                                !formState.settings
                                            ) {
                                                return;
                                            }

                                            setFormState({
                                                ...formState,
                                                settings: {
                                                    ...formState.settings,
                                                    show_location: itemValue,
                                                },
                                            });
                                        }}
                                        onBlur={handleBlur}>
                                        {locationSharingOptions.map(
                                            (option, index) => (
                                                <Picker.Item
                                                    key={`location-sharing-option-${index}`}
                                                    color={
                                                        colorMode == 'dark'
                                                            ? 'white'
                                                            : 'black'
                                                    }
                                                    label={option.label}
                                                    value={option.value}
                                                />
                                            ),
                                        )}
                                    </Picker>
                                )}
                            </Card>
                        </Fields>
                        <Divider style={{ marginTop: 20, marginBottom: 10 }} />
                        <Button
                            size="md"
                            action="primary"
                            onPress={() => handleLogout()}>
                            <ButtonText style={{ textAlign: 'center' }}>
                                Logga ut
                            </ButtonText>
                            <ActivityIndicator
                                size="small"
                                color="white"
                                animating={isLoading}
                            />
                        </Button>
                    </VStack>
                </ScrollView>
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

export default UserSettings;
