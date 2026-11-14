import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import useStore from '@/features/common/store/store';
import { updateUser, getInterestCategories } from '../services/userService';
import { InterestCategory, UserInterest } from '../constants/interests';
import InterestChecklist from '../components/InterestChecklist';
import { useToast } from '@/hooks/useToast';

const InterestsSettings: React.FC = () => {
  const { user, setUser } = useStore();
  const colorSchemeRaw = useColorScheme();
  const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light';
  const isDark = colorScheme === 'dark';
  const { showToast, ToastComponent } = useToast(colorScheme);
  const insets = useSafeAreaInsets();
  const styles = createStyles(isDark);

  const [categories, setCategories] = useState<InterestCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<UserInterest[]>(
    user?.interests ?? []
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const userRef = useRef(user);
  const showToastRef = useRef(showToast);
  userRef.current = user;
  showToastRef.current = showToast;

  useEffect(() => {
    getInterestCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length === 0) setLoadError(true);
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    const currentUser = userRef.current;
    if (!currentUser) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      showToastRef.current('Sparar...', 'info');
      updateUser({ settings: currentUser.settings, contact_info: currentUser.contact_info, interests: selected })
        .then(returned => {
          if (returned) setUser({ ...currentUser, ...returned });
          showToastRef.current('Sparat!', 'success');
        })
        .catch(() => showToastRef.current('Fel vid sparande', 'error'));
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [selected]);

  const toggle = (interest: UserInterest) => {
    setSelected(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  if (loadingCategories) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary500} />
      </ThemedView>
    );
  }

  if (loadError) {
    return (
      <ThemedView style={styles.centered}>
        <MaterialIcons name="wifi-off" size={40} color={Colors.coolGray400} />
        <ThemedText style={styles.errorText}>Kunde inte hämta intressen</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {ToastComponent}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <InterestChecklist categories={categories} selected={selected} onToggle={toggle} />
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { textAlign: 'center', opacity: 0.6, fontSize: 15 },
  scroll: { padding: 20 },
});

export default InterestsSettings;
