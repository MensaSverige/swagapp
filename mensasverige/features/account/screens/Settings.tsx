import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    ActivityIndicator,
    View,
    TextInput,
    Alert,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import useStore from '../../common/store/store';
import { updateUser } from '../services/userService';
import { ShowLocation, User, UserUpdate } from '../../../api_schema/types';
import { Picker } from '@react-native-picker/picker';
import ShowSettingsLabelIconColor from '../../common/components/ShowSettingsLabelIconColor';
import ShowSettingsLabelIcon from '../../common/components/ShowSettingsLabelIcon';
import AutosaveSuccessToast from '../../common/components/AutosaveSuccessToast';
import AutosaveErrorToast from '../../common/components/AutosaveErrorToast';
import AutosaveToast from '../../common/components/AutosaveToast';
import { resetUserCredentials } from '../../common/services/authService';
import ProfileEditAvatar from '../../common/components/ProfileEditAvatar';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const UserSettings: React.FC = () => {
    const { user, setUser } = useStore();
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary500');
    const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#262626' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e5e5', dark: '#404040' }, 'text');
    
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

    const styles = createStyles(backgroundColor, textColor, cardBackgroundColor, borderColor);

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
        let message;
        switch (type) {
            case 'save':
                message = 'Sparar...';
                break;
            case 'saved':
                message = 'Sparat!';
                break;
            case 'error':
                message = 'Fel vid sparande';
                break;
        }

        Alert.alert('Information', message);
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

    const FieldComponent: React.FC<{
        label: string;
        labelIcon?: any;
        labelIconColor?: string;
        children: React.ReactNode;
    }> = ({ label, labelIcon, labelIconColor, children }) => (
        <View style={styles.card}>
            <View style={styles.fieldHeader}>
                <ThemedText type="defaultSemiBold">{label}</ThemedText>
                {labelIcon && (
                    <MaterialIcons
                        name={labelIcon}
                        size={20}
                        color={labelIconColor || primaryColor}
                    />
                )}
            </View>
            {children}
        </View>
    );

    const FieldsComponent: React.FC<{
        heading: string;
        children: React.ReactNode;
    }> = ({ heading, children }) => (
        <View style={styles.fieldsContainer}>
            <ThemedText type="title" style={styles.sectionHeading}>{heading}</ThemedText>
            {children}
        </View>
    );

    const SwitchFieldComponent: React.FC<{
        label: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
    }> = ({ label, value, onValueChange }) => (
        <View style={styles.switchField}>
            <ThemedText>{label}</ThemedText>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: primaryColor }}
                thumbColor={value ? '#ffffff' : '#f4f3f4'}
            />
        </View>
    );

    return (
        <ThemedView style={styles.container} useSafeArea>
            <ParallaxScrollView
                headerImage={<FontAwesome name="user" size={100} color={primaryColor} />}
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}>
                
                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    {/* <ProfileEditAvatar
                        colorMode={colorScheme || 'light'}
                        onError={(error) => {
                            showToast('error');
                        }}
                        onSaved={() => {
                            console.log('saved received');
                            showToast('saved');
                        }}
                        onSaving={() => {
                            showToast('save');
                        }}
                    /> */}
                    <ThemedText type="title" style={styles.userName}>
                        {user.firstName} {user.lastName}
                    </ThemedText>
                </View>

                {/* Contact Information Section */}
                <FieldsComponent heading="Kontaktuppgifter">
                    <FieldComponent
                        label="E-post"
                        labelIcon={ShowSettingsLabelIcon(formState?.settings?.show_email)}
                        labelIconColor={ShowSettingsLabelIconColor(formState?.settings?.show_email)}>
                        <ThemedText style={styles.fieldValue}>
                            {user?.contact_info?.email || ''}
                        </ThemedText>
                    </FieldComponent>
                    
                    <FieldComponent
                        label="Telefonnummer"
                        labelIcon={ShowSettingsLabelIcon(formState?.settings?.show_phone)}
                        labelIconColor={ShowSettingsLabelIconColor(formState?.settings?.show_phone)}>
                        <TextInput
                            style={[styles.textInput, { color: textColor, borderColor }]}
                            keyboardType="numeric"
                            placeholder="07xxxxxxxx"
                            placeholderTextColor={useThemeColor({}, 'text') + '80'}
                            value={formState?.contact_info?.phone || ''}
                            onFocus={handleFocus}
                            onChangeText={(phone: string) => {
                                if (!formState || !formState.contact_info) {
                                    return;
                                }
                                setFormState({
                                    ...formState,
                                    contact_info: {
                                        ...formState.contact_info,
                                        phone: extractNumericValue(phone) || '',
                                    },
                                });
                            }}
                            onBlur={handleBlur}
                        />
                    </FieldComponent>
                </FieldsComponent>

                {/* Privacy Settings Section */}
                <FieldsComponent heading="Sekretess">
                    <View style={styles.card}>
                        <SwitchFieldComponent
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
                    </View>
                    
                    <View style={styles.card}>
                        <SwitchFieldComponent
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
                    </View>
                    
                    <View style={styles.card}>
                        <SwitchFieldComponent
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
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formState?.settings?.show_location}
                                    onValueChange={(itemValue: ShowLocation) => {
                                        if (!formState || !formState.settings) {
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
                                    style={[styles.picker, { color: textColor }]}>
                                    {locationSharingOptions.map((option, index) => (
                                        <Picker.Item
                                            key={`location-sharing-option-${index}`}
                                            label={option.label}
                                            value={option.value}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        )}
                    </View>
                </FieldsComponent>

                {/* Logout Button */}
                <View style={styles.divider} />
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: primaryColor }]}
                    onPress={handleLogout}
                    disabled={isLoading}>
                    <ThemedText 
                        style={[styles.logoutButtonText, { color: '#ffffff' }]}
                        type="defaultSemiBold">
                        Logga ut
                    </ThemedText>
                    {isLoading && (
                        <ActivityIndicator
                            size="small"
                            color="white"
                            style={styles.loadingIndicator}
                        />
                    )}
                </TouchableOpacity>
            </ParallaxScrollView>
        </ThemedView>
    );
};

const createStyles = (backgroundColor: string, textColor: string, cardBackgroundColor: string, borderColor: string) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        profileSection: {
            alignItems: 'center',
            marginBottom: 24,
        },
        userName: {
            marginTop: 12,
            textAlign: 'center',
        },
        fieldsContainer: {
            marginBottom: 24,
        },
        sectionHeading: {
            fontSize: 24,
            marginBottom: 16,
        },
        card: {
            backgroundColor: cardBackgroundColor,
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: borderColor,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
        },
        fieldHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        fieldValue: {
            marginTop: 8,
        },
        textInput: {
            borderWidth: 1,
            borderRadius: 6,
            padding: 12,
            marginTop: 8,
            fontSize: 16,
        },
        switchField: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        pickerContainer: {
            marginTop: 12,
            borderWidth: 1,
            borderColor: borderColor,
            borderRadius: 6,
        },
        picker: {
            height: 50,
        },
        divider: {
            height: 1,
            backgroundColor: borderColor,
            marginVertical: 20,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
        },
        logoutButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        loadingIndicator: {
            marginLeft: 8,
        },
        viewContainer: {
            flex: 1,
        },
        contentContainer: {
            padding: 10,
            flexGrow: 1,
        },
    });

export default UserSettings;
