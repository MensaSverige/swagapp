import React, { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { EditButton } from '@/features/common/components/EditButton';
import { createEditableFieldStyles } from '@/features/common/styles/editableFieldStyles';
import InterestChecklist from '@/features/account/components/InterestChecklist';
import { getInterestCategories } from '@/features/account/services/userService';
import { InterestCategory } from '@/features/account/constants/interests';
import { Tag } from '../../../api_schema/types';
import useStore from '../../common/store/store';
import { DIVIDER_COLOR, EVENT_HEADER_BG } from '../styles/typeScale';

interface TagPickerProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

/**
 * An activity's tags: a field like the form's others, showing the chosen
 * tags, that opens the same grouped list as the interests in settings. The
 * tags are the interests by name.
 */
const TagPicker: React.FC<TagPickerProps> = ({ selectedTags, onChange }) => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const fieldStyles = createEditableFieldStyles(scheme);
  const interestTags = useStore(s => s.interestTags);
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<InterestCategory[] | null>(null);

  useEffect(() => {
    if (open && categories === null) getInterestCategories().then(setCategories);
  }, [open, categories]);

  const tagByText = useMemo(() => new Map(interestTags.map(t => [t.text, t])), [interestTags]);
  const selectedTexts = useMemo(() => selectedTags.map(t => t.text), [selectedTags]);
  const summary = selectedTexts.join(', ');

  const toggle = (text: string) => {
    if (selectedTexts.includes(text)) {
      onChange(selectedTags.filter(t => t.text !== text));
      return;
    }
    const tag = tagByText.get(text);
    if (tag) onChange([...selectedTags, tag]);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={fieldStyles.editableField}
        accessibilityRole="button"
        accessibilityLabel={summary ? `Taggar: ${summary}. Ändra` : 'Välj taggar'}
      >
        <ThemedText style={[styles.summary, !summary && fieldStyles.placeholderText]}>
          {summary || 'Taggar'}
        </ThemedText>
        <EditButton onPress={() => setOpen(true)} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <ThemedView style={styles.sheet}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.sheet}>
            <View style={[styles.header, { borderBottomColor: scheme === 'dark' ? Colors.coolGray700 : DIVIDER_COLOR }]}>
              <ThemedText style={styles.title} accessibilityRole="header">Taggar</ThemedText>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.done} accessibilityRole="button">
                <ThemedText style={[styles.doneText, { color: scheme === 'dark' ? Colors.primary300 : EVENT_HEADER_BG }]}>
                  Klar
                </ThemedText>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.list}>
              {categories === null ? (
                <ActivityIndicator size="large" color={Colors.primary500} style={styles.loading} />
              ) : categories.length === 0 ? (
                <ThemedText style={styles.error}>Kunde inte hämta taggar</ThemedText>
              ) : (
                <InterestChecklist categories={categories} selected={selectedTexts} onToggle={toggle} />
              )}
            </ScrollView>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  summary: { flex: 1 },
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingLeft: 20,
    paddingRight: 8,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '600' },
  done: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  doneText: { fontSize: 17, fontWeight: '600' },
  list: { padding: 20 },
  loading: { marginTop: 40 },
  error: { textAlign: 'center', opacity: 0.6, fontSize: 15, marginTop: 40 },
});

export default TagPicker;
