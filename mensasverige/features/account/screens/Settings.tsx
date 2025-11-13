import React, { useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    View,
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
import { resetUserCredentials } from '../../common/services/authService';
import ProfileEditAvatar from '../../common/components/ProfileEditAvatar';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import { MaterialIcons } from '@expo/vector-icons';
import EditableField from '../../common/components/EditableField';
import { Colors } from '@/constants/Colors';


const UserSettings: React.FC = () => {
    const { user, setUser } = useStore();
    // user is guaranteed to be non-null due to AuthGuard wrapper
    const authenticatedUser = user!;
    const colorScheme = useColorScheme();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryColor = useThemeColor({}, 'primary500');
    const cardBackgroundColor = useThemeColor({ light: '#ffffff', dark: '#262626' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e5e5', dark: '#404040' }, 'text');
    const mutedTextColor = useThemeColor({ light: Colors.coolGray700, dark: Colors.coolGray400 }, 'text');

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
        getFormStateFromUser(authenticatedUser),
    );

    const styles = createStyles(backgroundColor, textColor, cardBackgroundColor, borderColor);

    const [isLoading, setIsLoading] = useState(false);
    const [locationSwitch, setLocationSwitch] = useState<boolean>(
        formState?.settings?.show_location === 'NO_ONE' ? false : true,
    );
    const [editingField, setEditingField] = useState<string | null>(null);

    const handleFocus = () => {
        setEditingField('phone');
    };

    const handleBlur = () => {
        setEditingField(null);
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
        if (!formState || editingField !== null) {
            return;
        }
        autosave(formState as User)?.then(returnedUser => {
            setUser({ ...user, ...returnedUser });
        });
    }, [formState, editingField]);

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
            .finally(() => { });
    };

    const locationSharingOptions: { value: ShowLocation, label: string }[] = useMemo(() => authenticatedUser.isMember ? [
        // Members can choose between all options
        { value: "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra medlemmar som visar sin position" },
        { value: "ALL_MEMBERS", label: "Alla medlemmar" },
        // {value:    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra deltagare som visar sin position"},
        // {value:                                 "EVERYONE", label: 'Alla'},
    ] : [
        // Non-members can only choose between non member specific options
        { value: "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: 'Andra deltagare som visar sin position' },
        { value: "EVERYONE", label: 'Alla' },
    ], [authenticatedUser.isMember]);

    // Reusable Components
    const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
        <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
                {title}
            </ThemedText>
            {subtitle && (
                <ThemedText style={styles.sectionSubtitle}>
                    {subtitle}
                </ThemedText>
            )}
        </View>
    );

    const PrivacyCard: React.FC<{
        title: string;
        description: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
        children?: React.ReactNode;
    }> = ({ title, description, value, onValueChange, children }) => (
        <View style={[styles.card, children && styles.expandableCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardContent}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        {title}
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                        {description}
                    </ThemedText>
                </View>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#767577', true: primaryColor }}
                    thumbColor={value ? '#ffffff' : '#f4f3f4'}
                />
            </View>
            {children && value && (
                <View style={styles.cardExpandedContent}>
                    {children}
                </View>
            )}
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <ParallaxScrollView>

                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    <ProfileEditAvatar
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
                    />
                    <ThemedText type="title" style={styles.profileName}>
                        {authenticatedUser.firstName} {authenticatedUser.lastName}
                    </ThemedText>
                </View>

                <SectionHeader title="Kontaktuppgifter" />
                
                <View style={styles.contactInfoContainer}>
                    <ThemedText style={styles.emailText}>
                        {user?.contact_info?.email}
                    </ThemedText>
                    <EditableField
                        label="Telefonnummer"
                        value={formState?.contact_info?.phone || ''}
                        placeholder="07xxxxxxxx"
                        isEditing={editingField === 'phone'}
                        onEdit={() => setEditingField('phone')}
                        onSave={(value) => {
                            if (!formState || !formState.contact_info) {
                                return;
                            }
                            setFormState({
                                ...formState,
                                contact_info: {
                                    ...formState.contact_info,
                                    phone: extractNumericValue(value) || '',
                                },
                            });
                            setEditingField(null);
                        }}
                        onValueChange={(value) => {
                            if (!formState || !formState.contact_info) {
                                return;
                            }
                            setFormState({
                                ...formState,
                                contact_info: {
                                    ...formState.contact_info,
                                    phone: extractNumericValue(value) || '',
                                },
                            });
                        }}
                        keyboardType="phone-pad"
                    />
                </View>

                <SectionHeader 
                    title="Vad andra kan se om dig" 
                    subtitle="Styr vilken information andra deltagare kan se i dina kontaktuppgifter"
                />

                <PrivacyCard
                    title="E-postadress"
                    description={formState?.settings?.show_email
                        ? "Andra kan se din e-post"
                        : "Din e-post är dold för andra"}
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

                <PrivacyCard
                    title="Telefonnummer"
                    description={formState?.settings?.show_phone
                        ? "Andra kan se ditt telefonnummer"
                        : "Ditt telefonnummer är dolt för andra"}
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

                <PrivacyCard
                    title="Platsuppgifter"
                    description={locationSwitch
                        ? "Andra kan se din position på kartan"
                        : "Din position är dold för andra"}
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
                                    show_location: authenticatedUser.isMember ? 'ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION' : 'EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION',
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
                    }}>
                    <View style={styles.locationDetailsContainer}>
                        <ThemedText style={styles.locationSubheading}>
                            Vem kan se din position?
                        </ThemedText>
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
                    </View>
                </PrivacyCard>


                {/* Logout Button */}
                <View style={styles.divider} />
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: primaryColor }]}
                        onPress={handleLogout}
                        disabled={isLoading}
                        activeOpacity={0.8}>
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
                </View>
            </ParallaxScrollView>
        </ThemedView>
    );
};

const createStyles = (backgroundColor: string, textColor: string, cardBackgroundColor: string, borderColor: string) =>
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20
        },
        // Profile Section
        profileSection: {
            alignItems: 'center',
            marginBottom: 24,
            gap: 12,
            paddingBottom: 16,
        },
        profileName: {
            textAlign: 'center',
            marginTop: 4,
        },
        
        // Section Headers
        sectionHeader: {
            marginTop: 24,
            marginBottom: 16,
        },
        sectionTitle: {
            marginBottom: 4,
        },
        sectionSubtitle: {
            opacity: 0.7,
            lineHeight: 20,
        },

        // Contact Info
        contactInfoContainer: {
            marginBottom: 16,
        },
        emailText: {
            color: textColor,
            opacity: 0.8,
            marginBottom: 12,
            fontSize: 16,
        },

        // Unified Card Styles
        card: {
            backgroundColor: cardBackgroundColor,
            borderRadius: 8,
            paddingVertical: 20,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        expandableCard: {
            // Additional styles for expandable cards if needed
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
        },
        cardContent: {
            flex: 1,
            marginRight: 16,
        },
        cardTitle: {
            marginBottom: 4,
        },
        cardDescription: {
            fontSize: 12,
            opacity: 0.7,
            lineHeight: 16,
        },
        cardExpandedContent: {
            marginTop: 16,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: borderColor,
        },

        // Location-specific styles
        locationDetailsContainer: {
            // Styles handled by cardExpandedContent
        },
        locationSubheading: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
            color: textColor,
        },
        pickerContainer: {
            marginTop: 12,
            borderWidth: 1,
            borderColor: borderColor,
            borderRadius: 6,
            backgroundColor: cardBackgroundColor,
        },
        picker: {
            height: 50,
        },

        // Action Section
        divider: {
            height: 1,
            backgroundColor: borderColor,
            marginVertical: 20,
            opacity: 0.5,
        },
        actionSection: {
            paddingBottom: 24,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        logoutButtonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        loadingIndicator: {
            marginLeft: 8,
        },

        // Legacy styles (kept for compatibility)
        fieldsContainer: {
            marginBottom: 24,
        },
        sectionHeading: {
            fontSize: 24,
            marginBottom: 16,
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
        switchField: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        viewContainer: {
            flex: 1,
        },
        contentContainer: {
            paddingHorizontal: 20,
            flexGrow: 1,
        },
        privacyHeader: {
            flex: 1,
            marginRight: 16,
        },
        privacyDescription: {
            fontSize: 12,
            opacity: 0.7,
            marginTop: 4,
        },
        locationCardExpanded: {
            flexDirection: 'column',
            alignItems: 'stretch',
        },
        locationCardHeader: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
        },
    });

export default UserSettings;
