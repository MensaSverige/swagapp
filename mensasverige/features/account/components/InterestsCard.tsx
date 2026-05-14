import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { InterestCategory } from '../constants/interests';

type Props = {
  sharedInterests: string[];
  nonSharedCategories: InterestCategory[];
  allInterestCategories: InterestCategory[];
  hasSharedInterests: boolean;
  isDark: boolean;
};

const VISIBLE_LIMIT = 6;

const InterestsCard: React.FC<Props> = ({
  sharedInterests,
  allInterestCategories,
  isDark,
}) => {
  const [showAll, setShowAll] = React.useState(false);
  const styles = createStyles(isDark);

  const allChips = [
    ...sharedInterests,
    ...allInterestCategories.flatMap(cat => cat.items).filter(i => !sharedInterests.includes(i)),
  ];
  const hasOverflow = allChips.length > VISIBLE_LIMIT;
  const visibleChips = showAll ? allChips : allChips.slice(0, VISIBLE_LIMIT);
  const hiddenCount = allChips.length - VISIBLE_LIMIT;

  return (
    <ThemedView style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.cardLabel}>Intressen</ThemedText>
        {hasOverflow && (
          <Pressable onPress={() => setShowAll(v => !v)} hitSlop={8} style={styles.viewAllButton}>
            <ThemedText style={styles.viewAllText}>
              {showAll ? 'Visa färre' : 'Visa alla'}
            </ThemedText>
            <IconSymbol
              name="chevron.right"
              size={18}
              weight="medium"
              color={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'}
              style={{ transform: [{ rotate: showAll ? '270deg' : '90deg' }] }}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.chipsRow}>
        {visibleChips.map(item => (
          <View
            key={item}
            style={[
              styles.chip,
              sharedInterests.includes(item) ? styles.sharedChip : styles.otherChip,
            ]}
          >
            <ThemedText style={styles.chipText}>{item}</ThemedText>
          </View>
        ))}
      </View>
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      opacity: 0.45,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: '600',
      opacity: 0.55,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
    },
    sharedChip: {
      backgroundColor: isDark
        ? 'rgba(59,130,246,0.14)'
        : 'rgba(59,130,246,0.10)',
      shadowColor: '#3B82F6',
      shadowOpacity: isDark ? 0.18 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    otherChip: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    },
    moreChip: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
    },
    moreChipText: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 18,
      opacity: 0.65,
    },
  });

export default InterestsCard;
