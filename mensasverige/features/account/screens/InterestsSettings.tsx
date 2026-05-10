import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import useStore from '@/features/common/store/store';
import { updateUser, getInterestCategories } from '../services/userService';
import { InterestCategory, UserInterest } from '../constants/interests';
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
  const [selected, setSelected] = useState<UserInterest[]>(
    ((user as any)?.interests as UserInterest[] | undefined) ?? []
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    getInterestCategories()
      .then(setCategories)
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (!user) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      showToast('Sparar...', 'info');
      updateUser({ settings: user.settings, contact_info: user.contact_info, interests: selected } as any)
        .then(returned => {
          if (returned) setUser({ ...user, ...returned });
          showToast('Sparat!', 'success');
        })
        .catch(() => showToast('Fel vid sparande', 'error'));
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

  return (
    <ThemedView style={styles.container}>
      {ToastComponent}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {categories.map(cat => (
          <View key={cat.category} style={styles.categoryBlock}>
            <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
            {cat.items.map(item => {
              const isSelected = selected.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => toggle(item)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.rowText}>{item}</ThemedText>
                  {isSelected && (
                    <MaterialIcons name="check" size={20} color={Colors.primary500} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  categoryBlock: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    opacity: 0.55,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
  },
  rowSelected: {
    backgroundColor: isDark ? 'rgba(79,193,255,0.08)' : 'rgba(0,119,230,0.06)',
  },
  rowText: {
    fontSize: 15,
    flex: 1,
  },
});

export default InterestsSettings;
