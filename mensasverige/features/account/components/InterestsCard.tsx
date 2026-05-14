import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Collapsible } from '@/components/Collapsible';
import { Colors } from '@/constants/Colors';
import { InterestCategory } from '../constants/interests';

type Props = {
  sharedInterests: string[];
  nonSharedCategories: InterestCategory[];
  allInterestCategories: InterestCategory[];
  hasSharedInterests: boolean;
  isDark: boolean;
};

const InterestsCard: React.FC<Props> = ({
  sharedInterests,
  nonSharedCategories,
  allInterestCategories,
  hasSharedInterests,
  isDark,
}) => {
  const styles = createStyles(isDark);

  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardLabelRow}>
        <ThemedText style={styles.cardLabel}>Intressen</ThemedText>
      </View>

      {hasSharedInterests ? (
        <>
          <View style={styles.chipsRow}>
            {sharedInterests.map(item => (
              <View key={item} style={[styles.chip, styles.sharedChip]}>
                <ThemedText style={styles.chipText}>{item}</ThemedText>
              </View>
            ))}
          </View>

          {nonSharedCategories.length > 0 && (
            <Collapsible
              title={`Se ${nonSharedCategories.reduce((n, c) => n + c.items.length, 0)} fler intressen`}
            >
              {nonSharedCategories.map(cat => (
                <View key={cat.category} style={styles.categoryBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
                  <View style={styles.chipsRow}>
                    {cat.items.map(item => (
                      <View key={item} style={[styles.chip, styles.otherChip]}>
                        <ThemedText style={styles.chipText}>{item}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Collapsible>
          )}
        </>
      ) : (
        <>
          {allInterestCategories.slice(0, 2).map(cat => (
            <View key={cat.category} style={styles.categoryBlock}>
              <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
              <View style={styles.chipsRow}>
                {cat.items.map(item => (
                  <View key={item} style={[styles.chip, styles.otherChip]}>
                    <ThemedText style={styles.chipText}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ))}
          {allInterestCategories.length > 2 && (
            <Collapsible
              title={`Visa fler (${allInterestCategories.length - 2} kategorier)`}
            >
              {allInterestCategories.slice(2).map(cat => (
                <View key={cat.category} style={styles.categoryBlock}>
                  <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>{cat.category}</ThemedText>
                  <View style={styles.chipsRow}>
                    {cat.items.map(item => (
                      <View key={item} style={[styles.chip, styles.otherChip]}>
                        <ThemedText style={styles.chipText}>{item}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </Collapsible>
          )}
        </>
      )}
    </ThemedView>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    cardLabelRow: {
      marginBottom: 14,
    },
    cardLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      opacity: 0.45,
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
      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 2,
    },

    otherChip: {
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.06)'
        : '#F3F4F6',
    },

    categoryBlock: {
      marginTop: 18,
    },

    categoryTitle: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 10,
      opacity: 0.72,
    },
  });

export default InterestsCard;
