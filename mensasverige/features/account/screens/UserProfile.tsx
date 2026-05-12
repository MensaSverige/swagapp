import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useColorScheme,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import useStore from '../../common/store/store';
import { resetUserCredentials } from '../../common/services/authService';
import ProfileEditAvatar from '../../common/components/ProfileEditAvatar';
import EditableField from '../../common/components/inputs/EditableField';
import { extractNumericValue } from '../../common/functions/extractNumericValue';
import { updateUser, getProfileOptions } from '../services/userService';
import { useToast } from '@/hooks/useToast';
import { DatepickerField } from '../../common/components/inputs/DatepickerField';
import { getGeoLocation } from '@/features/map/services/locationService';
import { ProfileOptionCategory, ProfileOptionItem } from '../constants/profileOptions';
import Dropdown from '../../common/components/inputs/Dropdown';

const UserProfile: React.FC = () => {
    const { user, setUser } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { showToast, ToastComponent } = useToast(colorScheme);
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabOverflow();
    const [isLoading, setIsLoading] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [phone, setPhone] = useState(user?.contact_info?.phone || '');
    const [hometown, setHometown] = useState(user?.hometown ?? '');
    const [birthdate, setBirthdate] = useState<Date | undefined>(
        user?.birthdate ? new Date(user.birthdate) : undefined
    );
    const [gender, setGender] = useState<string | null>(user?.gender ?? null);
    const [sexuality, setSexuality] = useState<string | null>(user?.sexuality ?? null);
    const [relationshipStyle, setRelationshipStyle] = useState<string | null>(user?.relationship_style ?? null);
    const [relationshipStatus, setRelationshipStatus] = useState<string | null>(user?.relationship_status ?? null);
    const [socialFlags, setSocialFlags] = useState<string[]>(user?.social_flags ?? []);
    const [profileOptionCategories, setProfileOptionCategories] = useState<ProfileOptionCategory[]>([]);

    useEffect(() => {
        getProfileOptions().then(setProfileOptionCategories);
    }, []);

    const styles = createStyles(colorScheme);

    function getCategoryItems(key: string): ProfileOptionItem[] {
        return profileOptionCategories.find(c => c.key === key)?.items ?? [];
    }

    function handleLogout() {
        Alert.alert(
            'Logga ut',
            'Är du säker på att du vill logga ut?',
            [
                { text: 'Avbryt', style: 'cancel' },
                {
                    text: 'Logga ut',
                    style: 'destructive',
                    onPress: () => {
                        setIsLoading(true);
                        resetUserCredentials()
                            .then(() => setUser(null))
                            .catch(error => console.error('Error logging out', error))
                            .finally(() => setIsLoading(false));
                    },
                },
            ]
        );
    }

    function savePhone(value: string) {
        if (!user) return;
        const cleaned = extractNumericValue(value) || '';
        setPhone(cleaned);
        setEditingField(null);
        showToast('Sparar...', 'info');
        updateUser({
            settings: user.settings,
            contact_info: {
                email: user.contact_info?.email || '',
                phone: cleaned,
            },
        })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }

    async function saveHometown(value: string) {
        if (!user) return;
        setEditingField(null);
        showToast('Sparar...', 'info');
        let resolved = value;
        try {
            const geo = await getGeoLocation(value);
            resolved = geo.formatted_address || value;
        } catch {
            // geocoding failed, store as typed
        }
        setHometown(resolved);
        updateUser({ settings: user.settings, hometown: resolved })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }

    function saveIdentityField(field: string, value: string, setter: (v: string) => void) {
        if (!user) return;
        setter(value);
        showToast('Sparar...', 'info');
        updateUser({ settings: user.settings, [field]: value || null })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }

    function toggleSocialFlag(value: string) {
        if (!user) return;
        const next = socialFlags.includes(value)
            ? socialFlags.filter(f => f !== value)
            : [...socialFlags, value];
        setSocialFlags(next);
        showToast('Sparar...', 'info');
        updateUser({ settings: user.settings, social_flags: next })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }

    function saveBirthdate(date: Date | undefined) {
        if (!user || !date) return;
        setBirthdate(date);
        const formatted = date.toISOString().slice(0, 10);
        showToast('Sparar...', 'info');
        updateUser({ settings: user.settings, birthdate: formatted })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }

    const NavRow: React.FC<{
        icon: keyof typeof MaterialIcons.glyphMap;
        title: string;
        subtitle?: string;
        onPress: () => void;
        hasBorder?: boolean;
    }> = ({ icon, title, subtitle, onPress, hasBorder }) => (
        <TouchableOpacity
            style={[styles.navRow, hasBorder && styles.navRowBorder]}
            onPress={onPress}
            activeOpacity={0.7}>
            <View style={styles.navRowIconWrap}>
                <MaterialIcons name={icon} size={20} color={Colors.primary500} />
            </View>
            <View style={styles.navRowContent}>
                <ThemedText type="defaultSemiBold" style={styles.navRowTitle}>{title}</ThemedText>
                {subtitle && <ThemedText style={styles.navRowSubtitle}>{subtitle}</ThemedText>}
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.coolGray400} />
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            {ToastComponent}
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: 8, paddingBottom: tabBarHeight + 88 },
                ]}
                showsVerticalScrollIndicator={false}>

                {/* Hero */}
                <View style={styles.hero}>
                    <ProfileEditAvatar
                        colorMode={colorScheme}
                        onError={err => showToast(err || 'Fel vid bilduppladdning', 'error')}
                        onSaved={() => showToast('Profilbild sparad!', 'success')}
                        onSaving={() => showToast('Sparar profilbild...', 'info')}
                    />
                    <ThemedText type="title" style={styles.heroName}>
                        {user?.firstName || ''} {user?.lastName || ''}
                    </ThemedText>
                </View>

                {/* Contact card */}
                <ThemedView style={styles.card}>
                    <ThemedText style={styles.cardLabel}>Kontaktuppgifter</ThemedText>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="email" size={18} color={Colors.coolGray500} />
                        <ThemedText style={styles.contactText}>
                            {user?.contact_info?.email || ''}
                        </ThemedText>
                    </View>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={18} color={Colors.coolGray500} style={styles.contactIcon} />
                        <View style={styles.contactFieldWrap}>
                            <EditableField
                                label="Telefonnummer"
                                value={phone}
                                placeholder="07xxxxxxxx"
                                isEditing={editingField === 'phone'}
                                onEdit={() => setEditingField('phone')}
                                onSave={savePhone}
                                onValueChange={value => setPhone(extractNumericValue(value) || '')}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>
                </ThemedView>

                {/* Personal details card */}
                <ThemedView style={styles.card}>
                    <ThemedText style={styles.cardLabel}>Personuppgifter</ThemedText>
                    <View style={styles.contactRow}>
                        <MaterialIcons name="home" size={18} color={Colors.coolGray500} />
                        <View style={styles.contactFieldWrap}>
                            <EditableField
                                label="Hemstad"
                                value={hometown}
                                placeholder="Stockholm"
                                isEditing={editingField === 'hometown'}
                                onEdit={() => setEditingField('hometown')}
                                onSave={saveHometown}
                                onValueChange={setHometown}
                            />
                        </View>
                    </View>
                    <View style={[styles.contactRow, { marginTop: 8 }]}>
                        <MaterialIcons name="cake" size={18} color={Colors.coolGray500} style={styles.contactIcon} />
                        <View style={styles.contactFieldWrap}>
                            <DatepickerField
                                label="Födelsedag"
                                date={birthdate}
                                mode="date"
                                placeholder="Välj datum"
                                onDateChange={saveBirthdate}
                            />
                        </View>
                    </View>
                </ThemedView>

                {/* Identity & relation */}
                <ThemedView style={styles.card}>
                    <ThemedText style={styles.cardLabel}>Identitet & relation</ThemedText>
                    {([
                        { icon: 'wc' as const,              label: 'Kön',           key: 'gender',               value: gender,             setter: setGender },
                        { icon: 'favorite' as const,        label: 'Läggning',      key: 'sexuality',            value: sexuality,          setter: setSexuality },
                        { icon: 'group' as const,           label: 'Relationsform', key: 'relationship_style',   value: relationshipStyle,  setter: setRelationshipStyle },
                        { icon: 'favorite-border' as const, label: 'Status',        key: 'relationship_status',  value: relationshipStatus, setter: setRelationshipStatus },
                    ]).map(row => (
                        <View key={row.key} style={[styles.contactRow, { marginBottom: 8, alignItems: 'flex-start' }]}>
                            <MaterialIcons name={row.icon} size={18} color={Colors.coolGray500} style={{ marginTop: 10 }} />
                            <View style={styles.contactFieldWrap}>
                                <ThemedText style={styles.identityLabel}>{row.label}</ThemedText>
                                <Dropdown
                                    options={[{ value: '', label: 'Ej angett' }, ...getCategoryItems(row.key)]}
                                    selectedValue={row.value || ''}
                                    onValueChange={v => saveIdentityField(row.key, v, row.setter)}
                                    placeholder="Välj alternativ"
                                />
                            </View>
                        </View>
                    ))}
                </ThemedView>

                {/* Settings navigation */}
                <ThemedView style={styles.card}>
                    <ThemedText style={styles.cardLabel}>Inställningar</ThemedText>
                    <NavRow
                        icon="lock"
                        title="Integritet & delning"
                        subtitle="Styr vad andra kan se om dig"
                        onPress={() => router.push('/(tabs)/(profile)/privacy')}
                    />
                    <NavRow
                        icon="tune"
                        title="Appinställningar"
                        subtitle="Uppdateringsintervall och bakgrundstjänster"
                        onPress={() => router.push('/(tabs)/(profile)/app-settings')}
                        hasBorder
                    />
                    <NavRow
                        icon="interests"
                        title="Intressen"
                        subtitle="Välj dina intressen och hobbyer"
                        onPress={() => router.push('/(tabs)/(profile)/interests')}
                        hasBorder
                    />
                </ThemedView>

                {/* Logout */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={isLoading}
                        activeOpacity={0.7}>
                        {isLoading
                            ? <ActivityIndicator size="small" color="#EF4444" />
                            : <>
                                <MaterialIcons name="logout" size={18} color="#EF4444" style={styles.logoutIcon} />
                                <ThemedText style={styles.logoutText} type="defaultSemiBold">Logga ut</ThemedText>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            </ScrollView>

        </ThemedView>
    );
};

const createStyles = (colorScheme: string) => {
    const isDark = colorScheme === 'dark';
    return StyleSheet.create({
        container: { flex: 1 },
        scroll: { paddingHorizontal: 20 },

        hero: {
            alignItems: 'center',
            paddingBottom: 28,
        },
        heroName: {
            textAlign: 'center',
            marginTop: 12,
        },
        badge: {
            marginTop: 8,
            backgroundColor: Colors.primary500,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
        },
        badgeText: {
            color: Colors.white,
            fontSize: 12,
            fontWeight: '600',
        },

        card: {
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowOpacity: 0.05,
            elevation: 1,
        },
        logoutContainer: {
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            padding: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
        },
        logoutIcon: {
            marginRight: 8,
        },
        logoutText: {
            fontSize: 16,
            color: '#EF4444',
        },
        cardLabel: {
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            opacity: 0.5,
            marginBottom: 12,
        },

        contactRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },
        contactIcon: {
            marginTop: 2,
        },
        contactText: {
            fontSize: 15,
            flex: 1,
            marginLeft: 10,
        },
        contactFieldWrap: {
            flex: 1,
            marginLeft: 10,
        },

        navRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
        },
        navRowBorder: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Colors.background200,
        },
        navRowIconWrap: {
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: isDark ? 'rgba(79,193,255,0.12)' : 'rgba(0,119,230,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
        },
        navRowContent: { flex: 1 },
        navRowTitle: { fontSize: 15 },
        navRowSubtitle: { fontSize: 12, opacity: 0.6, marginTop: 1 },

        identityLabel: { fontSize: 12, opacity: 0.55, marginBottom: 2 },

        socialChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        socialChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
        },
        socialChipSelected: {
            backgroundColor: isDark ? 'rgba(79,193,255,0.12)' : 'rgba(0,119,230,0.08)',
        },
        socialChipText: { fontSize: 13, opacity: 0.7 },
        socialChipTextSelected: { opacity: 1, color: Colors.primary500 },

    });
};

export default UserProfile;
