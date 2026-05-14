import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedInput } from '@/components/ThemedInput';
import { Colors } from '@/constants/Colors';
import { useToast } from '@/hooks/useToast';
import FeedbackBody from '../components/FeedbackBody';
import {
  listFeedback,
  listComments,
  createComment,
  voteFeedback,
  FeedbackItem,
  FeedbackComment,
} from '../services/feedbackService';

const FeedbackDetail: React.FC = () => {
  const params = useLocalSearchParams<{ number: string }>();
  const number = Number(params.number);
  const colorSchemeRaw = useColorScheme();
  const colorScheme: 'light' | 'dark' = colorSchemeRaw === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { showToast, ToastComponent } = useToast(colorScheme);

  const [item, setItem] = useState<FeedbackItem | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);

  const styles = createStyles(colorScheme === 'dark');

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([listFeedback('all'), listComments(number)])
      .then(([all, cs]) => {
        setItem(all.find(i => i.number === number) || null);
        setComments(cs);
      })
      .catch(() => {
        setItem(null);
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [number]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleVote = (value: -1 | 1) => {
    if (!item || item.mine || voting) return;
    const nextValue: -1 | 0 | 1 = item.votes.my_vote === value ? 0 : value;
    setVoting(true);
    voteFeedback(item.number, nextValue)
      .then(votes => setItem({ ...item, votes }))
      .catch(() => showToast('Rösten kunde inte sparas.', 'error'))
      .finally(() => setVoting(false));
  };

  const handleComment = () => {
    if (!commentBody.trim() || posting) return;
    setPosting(true);
    createComment(number, commentBody.trim())
      .then(c => {
        setComments(prev => [...prev, c]);
        setCommentBody('');
        showToast('Kommentar publicerad.', 'success');
      })
      .catch(() => showToast('Kunde inte spara kommentaren.', 'error'))
      .finally(() => setPosting(false));
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary500} />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Inlägget kunde inte hämtas.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {ToastComponent}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <ThemedView style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText type="defaultSemiBold" style={styles.title}>
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
            <ThemedText style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString('sv-SE')}
            </ThemedText>
            <ThemedText style={styles.metaDot}>·</ThemedText>
            <TouchableOpacity onPress={() => Linking.openURL(item.html_url)}>
              <ThemedText style={[styles.metaText, styles.metaLink]}>
                Visa på GitHub
              </ThemedText>
            </TouchableOpacity>
          </View>

          {!!item.body && (
            <View style={styles.bodyWrap}>
              <FeedbackBody body={item.body} textStyle={styles.body} />
            </View>
          )}

          <View style={styles.voteBar}>
            <TouchableOpacity
              style={styles.voteButton}
              disabled={item.mine || voting}
              onPress={() => handleVote(1)}>
              <MaterialIcons
                name="thumb-up"
                size={18}
                color={
                  item.mine
                    ? Colors.coolGray300
                    : item.votes.my_vote === 1
                      ? Colors.primary500
                      : Colors.coolGray500
                }
              />
              <ThemedText style={styles.voteCount}>{item.votes.up}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voteButton}
              disabled={item.mine || voting}
              onPress={() => handleVote(-1)}>
              <MaterialIcons
                name="thumb-down"
                size={18}
                color={
                  item.mine
                    ? Colors.coolGray300
                    : item.votes.my_vote === -1
                      ? '#EF4444'
                      : Colors.coolGray500
                }
              />
              <ThemedText style={styles.voteCount}>{item.votes.down}</ThemedText>
            </TouchableOpacity>
            {item.mine && (
              <ThemedText style={styles.voteHint}>Du röstar inte på egna inlägg</ThemedText>
            )}
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            Kommentarer
          </ThemedText>

          {comments.length === 0 ? (
            <ThemedText style={styles.empty}>Inga kommentarer ännu.</ThemedText>
          ) : (
            <View style={styles.commentList}>
              {comments.map((c, idx) => (
                <View
                  key={c.id}
                  style={[styles.commentRow, idx > 0 && styles.commentRowBorder]}>
                  <View style={styles.commentHeader}>
                    {c.mine ? (
                      <View style={styles.mineBadge}>
                        <ThemedText style={styles.mineBadgeText}>Du</ThemedText>
                      </View>
                    ) : c.author.type === 'github' ? (
                      <View style={styles.devBadge}>
                        <MaterialIcons name="verified" size={11} color={Colors.white} />
                        <ThemedText style={styles.devBadgeText}>
                          {c.author.label}
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.metaText}>{c.author.label}</ThemedText>
                    )}
                    <ThemedText style={styles.metaDot}>·</ThemedText>
                    <ThemedText style={styles.metaText}>
                      {new Date(c.created_at).toLocaleDateString('sv-SE')}
                    </ThemedText>
                  </View>
                  <View style={styles.commentBodyWrap}>
                    <FeedbackBody body={c.body} textStyle={styles.commentBody} />
                  </View>
                </View>
              ))}
            </View>
          )}

          <ThemedText style={styles.fieldLabel}>Skriv en kommentar</ThemedText>
          <ThemedInput
            style={styles.commentInput}
            value={commentBody}
            onChangeText={setCommentBody}
            placeholder="Vad tycker du?"
            multiline
            textAlignVertical="top"
          />
          <ThemedButton
            text="Kommentera"
            variant="primary"
            isLoading={posting}
            isDisabled={!commentBody.trim()}
            onPress={handleComment}
            style={styles.submit}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20 },
    card: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowOpacity: 0.05,
      elevation: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: { flex: 1, fontSize: 16, lineHeight: 22 },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    metaText: { fontSize: 12, opacity: 0.65 },
    metaDot: { fontSize: 12, opacity: 0.4 },
    metaLink: { color: Colors.primary500, opacity: 1 },
    mineBadge: {
      backgroundColor: Colors.primary500,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    mineBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
    devBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: Colors.secondary500,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    devBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
    bodyWrap: { marginTop: 12 },
    body: {
      fontSize: 14,
      lineHeight: 21,
    },
    commentBodyWrap: { marginTop: 6 },
    voteBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    voteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingRight: 4,
    },
    voteCount: { fontSize: 13 },
    voteHint: { marginLeft: 'auto', fontSize: 11, opacity: 0.5 },
    cardTitle: { marginBottom: 4 },
    empty: { marginTop: 10, opacity: 0.6, fontSize: 13 },
    commentList: { marginTop: 8 },
    commentRow: { paddingVertical: 10 },
    commentRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    commentBody: {
      fontSize: 14,
      lineHeight: 20,
    },
    fieldLabel: {
      fontSize: 13,
      opacity: 0.7,
      marginTop: 16,
      marginBottom: 6,
    },
    commentInput: {
      height: 100,
      paddingTop: 12,
    },
    submit: { marginTop: 12 },
    statePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statePillOpen: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    statePillClosed: { backgroundColor: 'rgba(148, 163, 184, 0.18)' },
    statePillText: { fontSize: 11, fontWeight: '600' },
  });

export default FeedbackDetail;
