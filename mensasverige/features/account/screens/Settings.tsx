import React, { useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    View,
    TouchableOpacity,
    Switch,
    useColorScheme,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ParallaxScrollView from '@/components/ParallaxScrollView';

import useStore from '../../common/store/store';
import { updateUser } from '../services/userService';
import { ShowLocation, User, UserUpdate } from '../../../api_schema/types';
import { resetUserCredentials } from '../../common/services/authService';
import ProfileEditAvatar from '../../common/components/ProfileEditAvatar';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import { MaterialIcons } from '@expo/vector-icons';
import EditableField from '../../common/components/EditableField';
import Dropdown, { DropdownOption } from '../../common/components/Dropdown';
import { Colors } from '@/constants/Colors';
import { DEFAULT_SETTINGS } from '@/constants/DefaultSettings';
import Slider from '@react-native-community/slider';
import { useToast } from '@/hooks/useToast';


const UserSettings: React.FC = () => {
    const { user, setUser } = useStore();
    const colorScheme = useColorScheme();
    const { showToast, hideToast, ToastComponent } = useToast(colorScheme);
    const getFormStateFromUser = (user: User) => ({
        contact_info: {
            email: user?.contact_info?.email || '',
            phone: user?.contact_info?.phone || '',
        },
        settings: {
            show_email: user?.settings?.show_email || false,
            show_phone: user?.settings?.show_phone || false,
            show_location: user?.settings?.show_location || 'NO_ONE',
            location_update_interval_seconds: user?.settings?.location_update_interval_seconds || DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS,
            events_refresh_interval_seconds: user?.settings?.events_refresh_interval_seconds || DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS,
            background_location_updates: user?.settings?.background_location_updates || DEFAULT_SETTINGS.BACKGROUND_LOCATION_UPDATES,
        },
    });

    const [formState, setFormState] = useState<UserUpdate>(() => {
        if (!user) {
            return {
                contact_info: { email: '', phone: '' },
                settings: {
                    show_email: false,
                    show_phone: false,
                    show_location: 'NO_ONE',
                    location_update_interval_seconds: DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS,
                    events_refresh_interval_seconds: DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS,
                    background_location_updates: DEFAULT_SETTINGS.BACKGROUND_LOCATION_UPDATES,
                }
            };
        }
        return getFormStateFromUser(user);
    });

    const styles = createStyles(colorScheme ?? 'light');

    const [isLoading, setIsLoading] = useState(false);
    const [locationSwitch, setLocationSwitch] = useState<boolean>(() => {
        // Initialize locationSwitch based on formState to avoid undefined access
        if (!user?.settings?.show_location) {
            return false;
        }
        return user.settings.show_location !== 'NO_ONE';
    });
    const [editingField, setEditingField] = useState<string | null>(null);
    
    // Temporary slider values to prevent saving on every change
    const [tempLocationInterval, setTempLocationInterval] = useState<number>(
        formState?.settings?.location_update_interval_seconds || DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS
    );
    const [tempEventsInterval, setTempEventsInterval] = useState<number>(
        formState?.settings?.events_refresh_interval_seconds || DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS
    );

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
        console.log('Autosave effect triggered');
        if (!formState || editingField !== null || editingField === 'slider') {
            return;
        }
        autosave(formState)?.then(returnedUser => {
            if (returnedUser && user) {
                setUser({ ...user, ...returnedUser });
            }
        }).catch(error => {
            console.error('Autosave failed:', error);
        });
    }, [formState, editingField, user?.userId]); // Use user.userId instead of user object to prevent infinite loop

    // Update temporary slider values when formState changes
    useEffect(() => {
        if (formState?.settings) {
            setTempLocationInterval(formState.settings.location_update_interval_seconds || DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS);
            setTempEventsInterval(formState.settings.events_refresh_interval_seconds || DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS);
        }
    }, [formState?.settings?.location_update_interval_seconds, formState?.settings?.events_refresh_interval_seconds]);

    const autosave = (formStateToSave: UserUpdate): Promise<User> | undefined => {
        if (
            !user ||
            JSON.stringify(getFormStateFromUser(user)) ===
            JSON.stringify(formStateToSave)
        ) {
            return;
        }
        showToast('Sparar...', 'info');

        return updateUser(formStateToSave)
            .then(returnedUser => {
                if (returnedUser && user) {
                    setUser({ ...user, ...returnedUser });
                    showToast('Sparat!', 'success');
                }
                return returnedUser;
            })
            .catch(error => {
                console.error('Error updating user', error);
                showToast('Fel vid sparande', 'error');
                throw error; // Re-throw to allow calling code to handle
            });
    };

    const locationSharingOptions: DropdownOption[] = useMemo(() => user?.isMember ? [
        // Members can choose between all options
        { value: "ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra medlemmar som visar sin position" },
        { value: "ALL_MEMBERS", label: "Alla medlemmar" },
        // {value:    "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: "Andra deltagare som visar sin position"},
        // {value:                                 "EVERYONE", label: 'Alla'},
    ] : [
        // Non-members can only choose between non member specific options
        { value: "EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION", label: 'Andra deltagare som visar sin position' },
        { value: "EVERYONE", label: 'Alla' },
    ], [user?.isMember]);

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

    const PrivacyInputGroup: React.FC<{
        title: string;
        description: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
        children?: React.ReactNode;
    }> = ({ title, description, value, onValueChange, children }) => (
        <ThemedView style={[styles.group, children && styles.expandableGroup]}>
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
                    trackColor={{ false: Colors.coolGray500, true: Colors.primary500 }}
                    thumbColor={value ? Colors.white : Colors.coolGray100}
                />
            </View>
            {children && value && (
                <ThemedView style={styles.cardExpandedContent}>
                    {children}
                </ThemedView>
            )}
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            {ToastComponent}
            <ParallaxScrollView>

                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    <ProfileEditAvatar
                        colorMode="light"
                        onError={(error) => {
                            showToast('Fel vid sparande', 'error');
                        }}
                        onSaved={() => {
                            console.log('saved received');
                            showToast('Sparat!', 'success');
                        }}
                        onSaving={() => {
                            showToast('Sparar...', 'info');
                        }}
                    />
                    <ThemedText type="title" style={styles.profileName}>
                        {user?.firstName || ''} {user?.lastName || ''}
                    </ThemedText>
                </View>

                <SectionHeader title="Kontaktuppgifter" />
                
                <View style={styles.contactInfoContainer}>
                    <ThemedText style={styles.emailText}>
                        {user?.contact_info?.email || ''}
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

                <PrivacyInputGroup
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

                <PrivacyInputGroup
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

                <PrivacyInputGroup
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
                                    show_location: user?.isMember ? 'ALL_MEMBERS_WHO_SHARE_THEIR_OWN_LOCATION' : 'EVERYONE_WHO_SHARE_THEIR_OWN_LOCATION',
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
                    <View>
                        <ThemedText style={styles.locationSubheading}>
                            Vem kan se din position?
                        </ThemedText>
                        <Dropdown
                            options={locationSharingOptions}
                            selectedValue={formState?.settings?.show_location || 'NO_ONE'}
                            onValueChange={(value) => {
                                if (!formState || !formState.settings) {
                                    return;
                                }
                                setFormState({
                                    ...formState,
                                    settings: {
                                        ...formState.settings,
                                        show_location: value as ShowLocation,
                                    },
                                });
                            }}
                            placeholder="Välj alternativ"
                            style={styles.dropdown}
                        />
                    </View>
                </PrivacyInputGroup>

                <SectionHeader 
                    title="Appinställningar" 
                    subtitle="Konfigurera uppdateringsintervall och appbeteende"
                />

                <ThemedView style={styles.group}>
                    <View style={styles.cardContent}>
                        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                            Platsuppdatering
                        </ThemedText>
                        <ThemedText style={styles.cardDescription}>
                            Uppdaterar var <ThemedText type="defaultSemiBold" style={[styles.cardDescription, { fontWeight: 'bold' }]}>
                                {Math.round(tempLocationInterval)}
                            </ThemedText> sekund{Math.round(tempLocationInterval) !== 1 ? 'er' : ''}
                        </ThemedText>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={{ height: 35 }}
                                value={tempLocationInterval}
                                minimumValue={DEFAULT_SETTINGS.MIN_LOCATION_UPDATE_SECONDS}
                                maximumValue={DEFAULT_SETTINGS.MAX_LOCATION_UPDATE_SECONDS}
                                step={5}
                                thumbTintColor={Colors.primary500}
                                minimumTrackTintColor={Colors.primary500}
                                maximumTrackTintColor={Colors.light.background200}
                                onValueChange={(value: number) => {
                                    setTempLocationInterval(value);
                                    setEditingField('slider'); // Prevent autosave while sliding
                                }}
                                onSlidingComplete={(value: number) => {
                                    if (!formState || !formState.settings) return;
                                    setFormState({
                                        ...formState,
                                        settings: {
                                            ...formState.settings,
                                            location_update_interval_seconds: value,
                                        },
                                    });
                                    setEditingField(null); // Allow autosave
                                }}
                            />
                        </View>
                        <View style={styles.sliderLabels}>
                            <ThemedText style={styles.sliderLabelText}>
                                {DEFAULT_SETTINGS.MIN_LOCATION_UPDATE_SECONDS}s
                            </ThemedText>
                            <ThemedText style={styles.sliderLabelText}>
                                {DEFAULT_SETTINGS.MAX_LOCATION_UPDATE_SECONDS / 60} min
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <ThemedView style={styles.group}>
                    <View style={styles.cardContent}>
                        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                            Evenemang
                        </ThemedText>
                        <ThemedText style={styles.cardDescription}>
                            Uppdaterar var <ThemedText type="defaultSemiBold" style={[styles.cardDescription, { fontWeight: 'bold' }]}>
                                {Math.round(tempEventsInterval)}
                            </ThemedText> sekund{Math.round(tempEventsInterval) !== 1 ? 'er' : ''}
                        </ThemedText>
                        <View style={styles.sliderContainer}>
                            <Slider
                                style={{ height: 35 }}
                                value={tempEventsInterval}
                                minimumValue={DEFAULT_SETTINGS.MIN_EVENTS_REFRESH_SECONDS}
                                maximumValue={DEFAULT_SETTINGS.MAX_EVENTS_REFRESH_SECONDS}
                                step={10}
                                thumbTintColor={Colors.primary500}
                                minimumTrackTintColor={Colors.primary500}
                                maximumTrackTintColor={Colors.light.background200}
                                onValueChange={(value: number) => {
                                    setTempEventsInterval(value);
                                    setEditingField('slider'); // Prevent autosave while sliding
                                }}
                                onSlidingComplete={(value: number) => {
                                    if (!formState || !formState.settings) return;
                                    setFormState({
                                        ...formState,
                                        settings: {
                                            ...formState.settings,
                                            events_refresh_interval_seconds: value,
                                        },
                                    });
                                    setEditingField(null); // Allow autosave
                                }}
                            />
                        </View>
                        <View style={styles.sliderLabels}>
                            <ThemedText style={styles.sliderLabelText}>
                                {DEFAULT_SETTINGS.MIN_EVENTS_REFRESH_SECONDS}s
                            </ThemedText>
                            <ThemedText style={styles.sliderLabelText}>
                                {DEFAULT_SETTINGS.MAX_EVENTS_REFRESH_SECONDS / 60} min
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>

                <PrivacyInputGroup
                    title="Bakgrundsplatsuppdateringar"
                    description={formState?.settings?.background_location_updates
                        ? "Platsuppdateringar fortsätter när appen är i bakgrunden"
                        : "Platsuppdateringar pausas när appen är i bakgrunden"}
                    value={formState?.settings?.background_location_updates || DEFAULT_SETTINGS.BACKGROUND_LOCATION_UPDATES}
                    onValueChange={(value) => {
                        if (!formState || !formState.settings) return;
                        setFormState({
                            ...formState,
                            settings: {
                                ...formState.settings,
                                background_location_updates: value,
                            },
                        });
                    }}
                />


                {/* Logout Button */}
                <ThemedView style={styles.divider} />
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.logoutButton, { backgroundColor: Colors.primary500 }]}
                        onPress={handleLogout}
                        disabled={isLoading}
                        activeOpacity={0.8}>
                        <ThemedText
                            style={[styles.logoutButtonText, { color: Colors.white }]}
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

const createStyles = (colorScheme: string) =>
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
            opacity: 0.8,
            marginBottom: 12,
            fontSize: 16,
        },
        group: {
            paddingVertical: 20,
            marginBottom: 12,
            //shadowColor: '#000',
            // shadowOffset: {
            //     width: 0,
            //     height: 1,
            // },
            shadowOpacity: 0.05,
            //shadowRadius: 3,
            elevation: 1,
        },
        expandableGroup: {
            // Additional styles for expandable groups if needed
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
            borderTopColor: Colors.background200 || '#E5E5E5',
        },
        locationSubheading: {
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 8,
        },
        pickerContainer: {
            marginTop: 12,
            borderWidth: 1,
            borderColor: Colors.background200 || '#E5E5E5',
            borderRadius: 6,
            overflow: 'hidden',
        },
        dropdown: {
            marginTop: 12,
        },

        // Slider styles
        sliderContainer: {
            marginTop: 8,
            marginBottom: 4,
        },
        sliderLabels: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 4,
        },
        sliderLabelText: {
            fontSize: 12,
            opacity: 0.6,
        },

        // Action Section
        divider: {
            height: 1,
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
