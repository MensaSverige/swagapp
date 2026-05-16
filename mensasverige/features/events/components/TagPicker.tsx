import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Tag } from '../../../api_schema/types';
import { INTEREST_TAGS, sortByUserInterests } from '../utils/interestTags';

interface TagPickerProps {
  selectedTags: Tag[];
  userInterests: string[];
  onChange: (tags: Tag[]) => void;
}

const TagPicker: React.FC<TagPickerProps> = ({ selectedTags, userInterests, onChange }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const sorted = useMemo(
    () => sortByUserInterests(INTEREST_TAGS, userInterests),
    [userInterests]
  );

  const selectedCodes = useMemo(
    () => new Set(selectedTags.map(t => t.code)),
    [selectedTags]
  );

  const toggle = (tag: Tag) => {
    if (selectedCodes.has(tag.code)) {
      onChange(selectedTags.filter(t => t.code !== tag.code));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isDark && styles.labelDark]}>Taggar</Text>
      <View style={styles.chips}>
        {sorted.map(tag => {
          const selected = selectedCodes.has(tag.code);
          return (
            <Pressable
              key={tag.code}
              onPress={() => toggle(tag)}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: tag.colorBackground, borderColor: tag.colorBackground }
                  : { backgroundColor: 'transparent', borderColor: tag.colorBackground },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? tag.colorText : tag.colorBackground },
                ]}
              >
                {tag.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#d1d5db',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TagPicker;
