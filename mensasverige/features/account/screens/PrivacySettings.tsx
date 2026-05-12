import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Dropdown, { DropdownOption } from '../../common/components/inputs/Dropdown';
import useStore from '../../common/store/store';
import { updateUser } from '../services/userService';
import { PrivacySetting } from '../../../api_schema/types';
import { DEFAULT_SETTINGS } from '@/constants/DefaultSettings';
import { useToast } from '@/hooks/useToast';

type PrivacyForm = {
    show_email: PrivacySetting;
    show_phone: PrivacySetting;
    show_profile: PrivacySetting;
    show_location: PrivacySetting;
    show_interests: PrivacySetting;
    show_hometown: PrivacySetting;
    show_birthdate: PrivacySetting;
    show_gender: PrivacySetting;
    show_sexuality: PrivacySetting;
    show_relationship_style: PrivacySetting;
    show_relationship_status: PrivacySetting;
};

const PrivacySettings: React.FC = () => {
    const { user, setUser } = useStore();
    const colorSchemeRaw = useColorScheme();
    const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light';
    const { showToast, ToastComponent } = useToast(colorScheme);
    const insets = useSafeAreaInsets();
    const initializedRef = useRef(false);

    const styles = createStyles();

    const [form, setForm] = useState<PrivacyForm>({
        show_email: user?.settings?.show_email || 'NO_ONE',
        show_phone: user?.settings?.show_phone || 'NO_ONE',
        show_profile: user?.settings?.show_profile || DEFAULT_SETTINGS.SHOW_PROFILE,
        show_location: user?.settings?.show_location || 'NO_ONE',
        show_interests: user?.settings?.show_interests || 'MEMBERS_ONLY',
        show_hometown: user?.settings?.show_hometown || 'MEMBERS_ONLY',
        show_birthdate: user?.settings?.show_birthdate || 'MEMBERS_ONLY',
        show_gender: user?.settings?.show_gender || 'NO_ONE',
        show_sexuality: user?.settings?.show_sexuality || 'NO_ONE',
        show_relationship_style: user?.settings?.show_relationship_style || 'NO_ONE',
        show_relationship_status: user?.settings?.show_relationship_status || 'NO_ONE'  
    });

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            return;
        }
        if (!user) return;

        showToast('Sparar...', 'info');
        updateUser({
            settings: { ...user.settings, ...form },
            contact_info: user.contact_info,
        })
            .then(returned => {
                if (returned) setUser({ ...user, ...returned });
                showToast('Sparat!', 'success');
            })
            .catch(() => showToast('Fel vid sparande', 'error'));
    }, [form]);

    const contactOptions: DropdownOption[] = useMemo(() => user?.isMember ? [
        { value: 'NO_ONE',          label: 'Ingen' },
        { value: 'MEMBERS_ONLY',    label: 'Alla medlemmar' },
        { value: 'MEMBERS_MUTUAL',  label: 'Medlemmar som visar sin profil' },
        { value: 'EVERYONE_MUTUAL', label: 'Alla inloggade deltagare som visar sin profil' },
        { value: 'EVERYONE',        label: 'Alla deltagare (även gäster)' },
    ] : [
        { value: 'NO_ONE',          label: 'Ingen' },
        { value: 'EVERYONE_MUTUAL', label: 'Alla inloggade deltagare som visar sin profil' },
        { value: 'EVERYONE',        label: 'Alla deltagare (även gäster)' },
    ], [user?.isMember]);

    const profileOptions: DropdownOption[] = useMemo(() => user?.isMember ? [
        { value: 'NO_ONE',          label: 'Ingen' },
        { value: 'MEMBERS_ONLY',    label: 'Alla medlemmar' },
        { value: 'MEMBERS_MUTUAL',  label: 'Medlemmar som visar sin profil' },
        { value: 'EVERYONE_MUTUAL', label: 'Alla inloggade deltagare som visar sin profil' },
        { value: 'EVERYONE',        label: 'Alla deltagare (även gäster)' },
    ] : [
        { value: 'NO_ONE',          label: 'Ingen' },
        { value: 'EVERYONE_MUTUAL', label: 'Alla inloggade deltagare som visar sin profil' },
        { value: 'EVERYONE',        label: 'Alla deltagare (även gäster)' },
    ], [user?.isMember]);

    const locationOptions: DropdownOption[] = useMemo(() => user?.isMember ? [
        { value: 'NO_ONE',         label: 'Ingen' },
        { value: 'MEMBERS_MUTUAL', label: 'Andra medlemmar som visar sin position' },
        { value: 'MEMBERS_ONLY',   label: 'Alla medlemmar' },
    ] : [
        { value: 'NO_ONE',          label: 'Ingen' },
        { value: 'EVERYONE_MUTUAL', label: 'Andra deltagare som visar sin position' },
        { value: 'EVERYONE',        label: 'Alla' },
    ], [user?.isMember]);

    const PrivacyCard: React.FC<{
        title: string;
        description: string;
        options: DropdownOption[];
        value: PrivacySetting;
        onChange: (value: PrivacySetting) => void;
    }> = ({ title, description, options, value, onChange }) => (
        <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{title}</ThemedText>
            <ThemedText style={styles.cardDescription}>{description}</ThemedText>
            <Dropdown
                options={options}
                selectedValue={value}
                onValueChange={v => onChange(v as PrivacySetting)}
                placeholder="Välj alternativ"
                style={styles.dropdown}
            />
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            {ToastComponent}
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}>
                <PrivacyCard
                    title="E-postadress"
                    description="Vem kan se din e-post?"
                    options={contactOptions}
                    value={form.show_email}
                    onChange={v => setForm(f => ({ ...f, show_email: v }))}
                />
                <PrivacyCard
                    title="Telefonnummer"
                    description="Vem kan se ditt telefonnummer?"
                    options={contactOptions}
                    value={form.show_phone}
                    onChange={v => setForm(f => ({ ...f, show_phone: v }))}
                />
                <PrivacyCard
                    title="Profiluppgifter"
                    description="Vem kan se ditt namn och din profilbild?"
                    options={profileOptions}
                    value={form.show_profile}
                    onChange={v => setForm(f => ({ ...f, show_profile: v }))}
                />
                <PrivacyCard
                    title="Platsuppgifter"
                    description="Vem kan se din position?"
                    options={locationOptions}
                    value={form.show_location}
                    onChange={v => setForm(f => ({ ...f, show_location: v }))}
                />
                <PrivacyCard
                    title="Intressen"
                    description="Vem kan se dina intressen och hobbyer?"
                    options={profileOptions}
                    value={form.show_interests}
                    onChange={v => setForm(f => ({ ...f, show_interests: v }))}
                />
                <PrivacyCard
                    title="Hemstad"
                    description="Vem kan se din hemstad?"
                    options={profileOptions}
                    value={form.show_hometown}
                    onChange={v => setForm(f => ({ ...f, show_hometown: v }))}
                />
                <PrivacyCard
                    title="Födelsedag"
                    description="Vem kan se din födelsedag (ålder)?"
                    options={profileOptions}
                    value={form.show_birthdate}
                    onChange={v => setForm(f => ({ ...f, show_birthdate: v }))}
                />
                <PrivacyCard
                    title="Kön"
                    description="Vem kan se ditt kön?"
                    options={profileOptions}
                    value={form.show_gender}
                    onChange={v => setForm(f => ({ ...f, show_gender: v }))}
                />
                <PrivacyCard
                    title="Läggning"
                    description="Vem kan se din läggning?"
                    options={profileOptions}
                    value={form.show_sexuality}
                    onChange={v => setForm(f => ({ ...f, show_sexuality: v }))}
                />
                <PrivacyCard
                    title="Relationsform"
                    description="Vem kan se din relationsform?"
                    options={profileOptions}
                    value={form.show_relationship_style}
                    onChange={v => setForm(f => ({ ...f, show_relationship_style: v }))}
                />
                <PrivacyCard
                    title="Relationsstatus"
                    description="Vem kan se din relationsstatus?"
                    options={profileOptions}
                    value={form.show_relationship_status}
                    onChange={v => setForm(f => ({ ...f, show_relationship_status: v }))}
                />
            </ScrollView>
        </ThemedView>
    );
};

const createStyles = () => StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20 },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowOpacity: 0.05,
        elevation: 1,
    },
    cardTitle: { marginBottom: 4 },
    cardDescription: {
        fontSize: 13,
        opacity: 0.65,
        lineHeight: 18,
    },
    dropdown: { marginTop: 10 },
});

export default PrivacySettings;
