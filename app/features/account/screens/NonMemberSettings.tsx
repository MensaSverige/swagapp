import React, { useEffect, useState } from 'react';
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
import { User, UserUpdate } from '../../../api_schema/types';
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

const NonMemberUserSettings: React.FC = () => {
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

                        <Text>Du är inloggad som</Text>
                        <Text>Medföljande eller internationell medlem</Text>
                        <Heading>
                            {user.userId}
                        </Heading>
                    </VStack>
                    <VStack space="lg" h="100%" bg="$background0" flex={1}>
                        <Button
                            size="sm"
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

export default NonMemberUserSettings;
