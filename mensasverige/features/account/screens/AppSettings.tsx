import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, View, Switch, useColorScheme } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import useStore from '../../common/store/store';
import { updateUser } from '../services/userService';
import { Colors } from '@/constants/Colors';
import { DEFAULT_SETTINGS } from '@/constants/DefaultSettings';
import { useToast } from '@/hooks/useToast';

type AppForm = {
    location_update_interval_seconds: number;
    events_refresh_interval_seconds: number;
    background_location_updates: boolean;
};

const AppSettings: React.FC = () => {
    const { user, setUser } = useStore();
    const colorScheme = useColorScheme() ?? 'light';
    const { showToast, ToastComponent } = useToast(colorScheme);
    const insets = useSafeAreaInsets();
    const initializedRef = useRef(false);
    const isSlidingRef = useRef(false);

    const styles = createStyles();

    const [form, setForm] = useState<AppForm>({
        location_update_interval_seconds:
            user?.settings?.location_update_interval_seconds ||
            DEFAULT_SETTINGS.LOCATION_UPDATE_INTERVAL_SECONDS,
        events_refresh_interval_seconds:
            user?.settings?.events_refresh_interval_seconds ||
            DEFAULT_SETTINGS.EVENTS_REFRESH_INTERVAL_SECONDS,
        background_location_updates:
            user?.settings?.background_location_updates ||
            DEFAULT_SETTINGS.BACKGROUND_LOCATION_UPDATES,
    });

    const [tempLocation, setTempLocation] = useState(form.location_update_interval_seconds);
    const [tempEvents, setTempEvents] = useState(form.events_refresh_interval_seconds);

    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            return;
        }
        if (!user || isSlidingRef.current) return;

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

    return (
        <ThemedView style={styles.container}>
            {ToastComponent}
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}>

                {/* Location update interval */}
                <ThemedView style={styles.card}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        Platsuppdatering
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                        Uppdaterar var{' '}
                        <ThemedText type="defaultSemiBold" style={styles.cardDescription}>
                            {Math.round(tempLocation)}
                        </ThemedText>{' '}
                        sekund{Math.round(tempLocation) !== 1 ? 'er' : ''}
                    </ThemedText>
                    <Slider
                        style={{ height: 35, marginTop: 8 }}
                        value={tempLocation}
                        minimumValue={DEFAULT_SETTINGS.MIN_LOCATION_UPDATE_SECONDS}
                        maximumValue={DEFAULT_SETTINGS.MAX_LOCATION_UPDATE_SECONDS}
                        step={5}
                        thumbTintColor={Colors.primary500}
                        minimumTrackTintColor={Colors.primary500}
                        maximumTrackTintColor={Colors.light.background200}
                        onValueChange={(v: number) => {
                            isSlidingRef.current = true;
                            setTempLocation(v);
                        }}
                        onSlidingComplete={(v: number) => {
                            isSlidingRef.current = false;
                            setForm(f => ({ ...f, location_update_interval_seconds: v }));
                        }}
                    />
                    <View style={styles.sliderLabels}>
                        <ThemedText style={styles.sliderLabel}>
                            {DEFAULT_SETTINGS.MIN_LOCATION_UPDATE_SECONDS}s
                        </ThemedText>
                        <ThemedText style={styles.sliderLabel}>
                            {DEFAULT_SETTINGS.MAX_LOCATION_UPDATE_SECONDS / 60} min
                        </ThemedText>
                    </View>
                </ThemedView>

                {/* Events refresh interval */}
                <ThemedView style={styles.card}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        Evenemang
                    </ThemedText>
                    <ThemedText style={styles.cardDescription}>
                        Uppdaterar var{' '}
                        <ThemedText type="defaultSemiBold" style={styles.cardDescription}>
                            {Math.round(tempEvents)}
                        </ThemedText>{' '}
                        sekund{Math.round(tempEvents) !== 1 ? 'er' : ''}
                    </ThemedText>
                    <Slider
                        style={{ height: 35, marginTop: 8 }}
                        value={tempEvents}
                        minimumValue={DEFAULT_SETTINGS.MIN_EVENTS_REFRESH_SECONDS}
                        maximumValue={DEFAULT_SETTINGS.MAX_EVENTS_REFRESH_SECONDS}
                        step={10}
                        thumbTintColor={Colors.primary500}
                        minimumTrackTintColor={Colors.primary500}
                        maximumTrackTintColor={Colors.light.background200}
                        onValueChange={(v: number) => {
                            isSlidingRef.current = true;
                            setTempEvents(v);
                        }}
                        onSlidingComplete={(v: number) => {
                            isSlidingRef.current = false;
                            setForm(f => ({ ...f, events_refresh_interval_seconds: v }));
                        }}
                    />
                    <View style={styles.sliderLabels}>
                        <ThemedText style={styles.sliderLabel}>
                            {DEFAULT_SETTINGS.MIN_EVENTS_REFRESH_SECONDS}s
                        </ThemedText>
                        <ThemedText style={styles.sliderLabel}>
                            {DEFAULT_SETTINGS.MAX_EVENTS_REFRESH_SECONDS / 60} min
                        </ThemedText>
                    </View>
                </ThemedView>

                {/* Background location toggle */}
                <ThemedView style={styles.card}>
                    <View style={styles.switchRow}>
                        <View style={styles.switchContent}>
                            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                                Bakgrundsplatsuppdateringar
                            </ThemedText>
                            <ThemedText style={styles.cardDescription}>
                                {form.background_location_updates
                                    ? 'Platsuppdateringar fortsätter när appen är i bakgrunden'
                                    : 'Platsuppdateringar pausas när appen är i bakgrunden'}
                            </ThemedText>
                        </View>
                        <Switch
                            value={form.background_location_updates}
                            onValueChange={v =>
                                setForm(f => ({ ...f, background_location_updates: v }))
                            }
                            trackColor={{ false: Colors.coolGray500, true: Colors.primary500 }}
                            thumbColor={
                                form.background_location_updates ? Colors.white : Colors.coolGray100
                            }
                        />
                    </View>
                </ThemedView>

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
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    sliderLabel: { fontSize: 12, opacity: 0.6 },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchContent: { flex: 1, marginRight: 16 },
});

export default AppSettings;
