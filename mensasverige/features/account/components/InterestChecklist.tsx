import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { InterestCategory, UserInterest } from '../constants/interests';

interface InterestChecklistProps {
  categories: InterestCategory[];
  selected: readonly string[];
  onToggle: (item: UserInterest) => void;
}

/**
 * Interests grouped by category, one row each with a check when chosen. The
 * one way to pick interests: a profile's in settings, and an activity's tags.
 */
const InterestChecklist: React.FC<InterestChecklistProps> = ({ categories, selected, onToggle }) => {
  const isDark = useColorScheme() === 'dark';
  const styles = createStyles(isDark);

  return (
    <>
      {categories.map(cat => (
        <View key={cat.category} style={styles.categoryBlock}>
          <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
          {cat.items.map(item => {
            const isSelected = selected.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => onToggle(item)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
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
    </>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
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
    minHeight: 44,
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

export default InterestChecklist;
