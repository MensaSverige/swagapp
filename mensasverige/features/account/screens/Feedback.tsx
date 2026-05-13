import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import Dropdown, { DropdownOption } from '../../common/components/inputs/Dropdown';
import { Colors } from '@/constants/Colors';
import { useToast } from '@/hooks/useToast';
import {
  createFeedback,
  listFeedback,
  voteFeedback,
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
  const [loadingList, setLoadingList] = useState(true);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [voting, setVoting] = useState<number | null>(null);

  const styles = createStyles(colorScheme === 'dark');

  const refresh = useCallback(() => {
    setLoadingList(true);
    listFeedback('all')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = () => {
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    createFeedback({ title: title.trim(), body: body.trim(), kind })
      .then(() => {
        showToast('Tack! Inlägget är skickat.', 'success');
        setTitle('');
        setBody('');
        setKind('feedback');
        refresh();
      })
      .catch(() => showToast('Kunde inte skicka. Försök igen.', 'error'))
      .finally(() => setSubmitting(false));
  };

  const handleVote = (item: FeedbackItem, value: -1 | 1) => {
    if (item.mine || voting === item.number) return;
    const nextValue: -1 | 0 | 1 = item.votes.my_vote === value ? 0 : value;
    setVoting(item.number);
    voteFeedback(item.number, nextValue)
      .then(votes => {
        setItems(prev =>
          prev.map(i => (i.number === item.number ? { ...i, votes } : i)),
        );
      })
      .catch(() => showToast('Rösten kunde inte sparas.', 'error'))
      .finally(() => setVoting(null));
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
            Skicka en idé, en bugg eller annan feedback. Inläggen blir ärenden
            på vår GitHub och syns publikt.
          </ThemedText>

          <ThemedText style={styles.fieldLabel}>Typ</ThemedText>
          <Dropdown
            options={KIND_OPTIONS}
            selectedValue={kind}
            onValueChange={v => setKind(v as FeedbackKind)}
            placeholder="Välj typ"
          />

          <ThemedText style={styles.fieldLabel}>Rubrik</ThemedText>
          <ThemedInput
            value={title}
            onChangeText={setTitle}
            placeholder="Kort beskrivning"
            maxLength={200}
          />

          <ThemedText style={styles.fieldLabel}>Beskrivning</ThemedText>
          <ThemedInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Vad vill du berätta?"
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
          <View style={styles.listHeader}>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              Alla inlägg
            </ThemedText>
            <TouchableOpacity onPress={refresh} disabled={loadingList}>
              <MaterialIcons
                name="refresh"
                size={20}
                color={Colors.coolGray500}
              />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.cardDescription}>
            Rösta på idéer från andra och följ vad utvecklarna gör med dem.
          </ThemedText>

          {loadingList ? (
            <ActivityIndicator style={styles.loader} color={Colors.primary500} />
          ) : items.length === 0 ? (
            <ThemedText style={styles.empty}>Inga inlägg ännu.</ThemedText>
          ) : (
            <View style={styles.list}>
              {items.map((item, idx) => (
                <View
                  key={item.number}
                  style={[styles.row, idx > 0 && styles.rowBorder]}>
                  <View style={styles.voteCol}>
                    <TouchableOpacity
                      hitSlop={8}
                      disabled={item.mine || voting === item.number}
                      onPress={() => handleVote(item, 1)}>
                      <MaterialIcons
                        name="keyboard-arrow-up"
                        size={26}
                        color={
                          item.mine
                            ? Colors.coolGray300
                            : item.votes.my_vote === 1
                              ? Colors.primary500
                              : Colors.coolGray500
                        }
                      />
                    </TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.voteScore}>
                      {item.votes.score}
                    </ThemedText>
                    <TouchableOpacity
                      hitSlop={8}
                      disabled={item.mine || voting === item.number}
                      onPress={() => handleVote(item, -1)}>
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={26}
                        color={
                          item.mine
                            ? Colors.coolGray300
                            : item.votes.my_vote === -1
                              ? '#EF4444'
                              : Colors.coolGray500
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.rowMain}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push(`/(tabs)/(profile)/feedback/${item.number}`)
                    }>
                    <View style={styles.titleRow}>
                      <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
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
                    <View style={styles.metaRow}>
                      {item.mine ? (
                        <View style={styles.mineBadge}>
                          <ThemedText style={styles.mineBadgeText}>Du</ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={styles.metaText}>{item.author.label}</ThemedText>
                      )}
                      <ThemedText style={styles.metaDot}>·</ThemedText>
                      <ThemedText style={styles.metaText}>#{item.number}</ThemedText>
                      <ThemedText style={styles.metaDot}>·</ThemedText>
                      <ThemedText style={styles.metaText}>
                        {new Date(item.created_at).toLocaleDateString('sv-SE')}
                      </ThemedText>
                      {item.comments > 0 && (
                        <>
                          <ThemedText style={styles.metaDot}>·</ThemedText>
                          <MaterialIcons name="chat-bubble-outline" size={12} color={Colors.coolGray500} />
                          <ThemedText style={styles.metaText}>{item.comments}</ThemedText>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
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
    bodyInput: {
      height: 140,
      paddingTop: 12,
    },
    submit: { marginTop: 18 },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    loader: { marginVertical: 16 },
    empty: {
      marginTop: 12,
      opacity: 0.6,
      fontSize: 13,
    },
    list: { marginTop: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      gap: 8,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    voteCol: {
      alignItems: 'center',
      minWidth: 36,
      paddingTop: 2,
    },
    voteScore: {
      fontSize: 13,
    },
    rowMain: { flex: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: { flex: 1, fontSize: 14, lineHeight: 19 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    metaText: { fontSize: 11, opacity: 0.6 },
    metaDot: { fontSize: 11, opacity: 0.4 },
    mineBadge: {
      backgroundColor: Colors.primary500,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    mineBadgeText: {
      color: Colors.white,
      fontSize: 10,
      fontWeight: '600',
    },
    statePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statePillOpen: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    statePillClosed: { backgroundColor: 'rgba(148, 163, 184, 0.18)' },
    statePillText: { fontSize: 10, fontWeight: '600' },
  });

export default Feedback;
