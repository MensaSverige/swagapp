import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import Dropdown, { DropdownOption } from '../../common/components/inputs/Dropdown';
import { Colors } from '@/constants/Colors';
import { useToast } from '@/hooks/useToast';
import {
  createFeedback,
  listFeedback,
  FeedbackItem,
  FeedbackKind,
} from '../services/feedbackService';

const KIND_OPTIONS: DropdownOption[] = [
  { value: 'feedback', label: 'Övrig feedback' },
  { value: 'idea', label: 'Idé' },
  { value: 'bug', label: 'Bugg' },
];

const Feedback: React.FC = () => {
  const colorSchemeRaw = useColorScheme();
  const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { showToast, ToastComponent } = useToast(colorScheme);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [kind, setKind] = useState<FeedbackKind>('feedback');
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<FeedbackItem[]>([]);

  const styles = createStyles(colorScheme === 'dark');

  const refreshHistory = () => {
    setLoadingHistory(true);
    listFeedback()
      .then(items => setHistory(items))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    createFeedback({ title: title.trim(), body: body.trim(), kind })
      .then(() => {
        showToast('Tack! Inlägget är skickat.', 'success');
        setTitle('');
        setBody('');
        setKind('feedback');
        refreshHistory();
      })
      .catch(() => showToast('Kunde inte skicka. Försök igen.', 'error'))
      .finally(() => setSubmitting(false));
  };

  return (
    <ThemedView style={styles.container}>
      {ToastComponent}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Nytt inlägg
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            Skicka en idé, en bugg eller annan feedback. Inläggen blir
            ärenden på vår GitHub och är synliga publikt.
          </ThemedText>

          <ThemedText style={styles.fieldLabel}>Typ</ThemedText>
          <Dropdown
            options={KIND_OPTIONS}
            selectedValue={kind}
            onValueChange={v => setKind(v as FeedbackKind)}
            placeholder="Välj typ"
            style={styles.dropdown}
          />

          <ThemedText style={styles.fieldLabel}>Rubrik</ThemedText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Kort beskrivning"
            placeholderTextColor={Colors.coolGray500}
            maxLength={200}
          />

          <ThemedText style={styles.fieldLabel}>Beskrivning</ThemedText>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Vad vill du berätta?"
            placeholderTextColor={Colors.coolGray500}
            multiline
            textAlignVertical="top"
          />

          <ThemedButton
            text="Skicka"
            variant="primary"
            isLoading={submitting}
            isDisabled={!title.trim() || !body.trim()}
            onPress={handleSubmit}
            style={styles.submit}
          />
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Mina inlägg
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            Här ser du dina tidigare inlägg och deras status.
          </ThemedText>

          {loadingHistory ? (
            <ActivityIndicator style={styles.loader} color={Colors.primary500} />
          ) : history.length === 0 ? (
            <ThemedText style={styles.empty}>
              Du har inga inlägg ännu.
            </ThemedText>
          ) : (
            <View style={styles.historyList}>
              {history.map((item, idx) => (
                <TouchableOpacity
                  key={item.number}
                  style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                  onPress={() => Linking.openURL(item.html_url)}
                  activeOpacity={0.7}>
                  <View style={styles.historyTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.historyTitle} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <View
                      style={[
                        styles.statePill,
                        item.state === 'closed' ? styles.statePillClosed : styles.statePillOpen,
                      ]}>
                      <ThemedText style={styles.statePillText}>
                        {item.state === 'closed' ? 'Stängd' : 'Öppen'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.historyMeta}>
                    <ThemedText style={styles.historyMetaText}>
                      #{item.number} · {new Date(item.created_at).toLocaleDateString('sv-SE')}
                    </ThemedText>
                    <MaterialIcons name="open-in-new" size={14} color={Colors.coolGray500} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
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
    fieldLabel: {
      fontSize: 13,
      opacity: 0.7,
      marginTop: 14,
      marginBottom: 6,
    },
    dropdown: { marginTop: 0 },
    input: {
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.dark.text,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    },
    bodyInput: {
      minHeight: 120,
      paddingTop: 12,
    },
    submit: { marginTop: 18 },
    loader: { marginVertical: 16 },
    empty: {
      marginTop: 12,
      opacity: 0.6,
      fontSize: 13,
    },
    historyList: { marginTop: 8 },
    historyRow: {
      paddingVertical: 12,
    },
    historyRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    historyTitle: { flex: 1 },
    historyMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    historyMetaText: { fontSize: 12, opacity: 0.55 },
    statePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statePillOpen: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    statePillClosed: { backgroundColor: 'rgba(148, 163, 184, 0.18)' },
    statePillText: { fontSize: 11, fontWeight: '600' },
  });

export default Feedback;
