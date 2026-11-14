import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { EVENT_CATEGORIES } from '../utilities/EventCategories';
import { FilterButton } from './FilterButton';
import { DatepickerField } from '@/features/common/components/inputs/DatepickerField';
import { EventFilterOptions } from '../store/EventsSlice';
import { ThemedText } from '@/components/ThemedText';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import {
  DEFAULT_LOCAL_EVENT_FILTER,
  DISTANCE_OPTIONS_KM,
  LocalEventFilter,
  LocalGroupOption,
} from '../utils/localEventFilter';


const { width: screenWidth } = Dimensions.get('window');

type TriKey = 'attendingOrHost' | 'bookable' | 'official';
const TRI_OPTIONS: Array<{ label: string; value: boolean | null }> = [
  { label: 'Alla', value: null },
  { label: 'Ja', value: true },
  { label: 'Nej', value: false },
];

interface EventFilterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: EventFilterOptions, localFilter?: LocalEventFilter) => void;
  currentFilter: EventFilterOptions;
  /** Local groups to choose from. Empty or absent hides the "Lokala träffar" section. */
  localGroups?: LocalGroupOption[];
  currentLocalFilter?: LocalEventFilter;
  /** Whether the user's position is known; distance filtering needs it. */
  hasUserPosition?: boolean;
}

export const EventFilter: React.FC<EventFilterProps> = ({
  visible,
  onClose,
  onApplyFilter,
  currentFilter,
  localGroups = [],
  currentLocalFilter = DEFAULT_LOCAL_EVENT_FILTER,
  hasUserPosition = false,
}) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [localFilter, setLocalFilter] = useState<EventFilterOptions>(currentFilter);
  const [draftLocal, setDraftLocal] = useState<LocalEventFilter>(currentLocalFilter);
  // The last picked groups, so switching to distance and back does not lose them.
  const [lastRegions, setLastRegions] = useState<string[]>(
    currentLocalFilter.mode === 'regions' ? currentLocalFilter.regions : [],
  );
  const showLocalSection = localGroups.length > 0;
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.75)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Bottom margin for iOS
  const bottom = useBottomTabOverflow();

  useEffect(() => {
    setLocalFilter(currentFilter);
  }, [currentFilter]);

  useEffect(() => {
    setDraftLocal(currentLocalFilter);
    if (currentLocalFilter.mode === 'regions') setLastRegions(currentLocalFilter.regions);
  }, [currentLocalFilter]);

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth * 0.75,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleApply = () => {
    // "Lokalavdelning" with nothing ticked keeps everything: store it as "Alla".
    const local: LocalEventFilter =
      draftLocal.mode === 'regions' && draftLocal.regions.length === 0 ? { mode: 'all' } : draftLocal;
    onApplyFilter(localFilter, showLocalSection ? local : undefined);
    onClose();
  };

  const toggleRegion = (key: string) => {
    setDraftLocal(prev => {
      const regions = prev.mode === 'regions' ? prev.regions : [];
      const next = regions.includes(key) ? regions.filter(r => r !== key) : [...regions, key];
      setLastRegions(next);
      return { mode: 'regions', regions: next };
    });
  };

  const handleReset = () => {
    const resetFilter: EventFilterOptions = {
      attendingOrHost: null,
      bookable: null,
      official: null,
      categories: [],
      dateFrom: null, // Don't set a default date - let it be null
      dateTo: null,
    };
    setLocalFilter(resetFilter);
    setDraftLocal({ mode: 'all' });
    setLastRegions([]);
  };

  const toggleCategory = (categoryCode: string) => {
    setLocalFilter(prev => {
      const categories = prev.categories || [];
      const isSelected = categories.includes(categoryCode);
      
      return {
        ...prev,
        categories: isSelected
          ? categories.filter(c => c !== categoryCode)
          : [...categories, categoryCode]
      };
    });
  };

  const handleDateFromChange = (date?: Date) => {
    setLocalFilter(prev => ({ 
      ...prev, 
      dateFrom: date || null,
      // Reset dateTo if it's before the new dateFrom
      dateTo: (date && prev.dateTo && prev.dateTo < date) ? null : prev.dateTo
    }));
  };

  const handleDateToChange = (date?: Date) => {
    setLocalFilter(prev => ({ ...prev, dateTo: date || null }));
  };

  const styles = createStyles(colorScheme ?? 'light');
  const selectedColor = colorScheme === 'dark' ? Colors.primary300 : '#005DB4';
  const unselectedColor = colorScheme === 'dark' ? '#9ca3af' : '#6b7280';

  /** One tappable row with a radio or checkbox icon; `indent` for the choices under a mode. */
  const choiceRow = (opts: {
    key: string;
    label: string;
    selected: boolean;
    onPress: () => void;
    kind: 'radio' | 'check';
    indent?: boolean;
    disabled?: boolean;
    trailing?: string;
  }) => {
    const icon = opts.kind === 'radio'
      ? (opts.selected ? 'radio-button-checked' : 'radio-button-unchecked')
      : (opts.selected ? 'check-box' : 'check-box-outline-blank');
    return (
      <TouchableOpacity
        key={opts.key}
        style={[styles.choiceRow, opts.indent && styles.choiceRowIndent, opts.disabled && styles.choiceRowDisabled]}
        onPress={opts.onPress}
        disabled={opts.disabled}
        accessibilityRole={opts.kind === 'radio' ? 'radio' : 'checkbox'}
        accessibilityState={{ checked: opts.selected, disabled: Boolean(opts.disabled) }}
      >
        <MaterialIcons name={icon} size={22} color={opts.selected ? selectedColor : unselectedColor} />
        <ThemedText style={styles.choiceLabel}>{opts.label}</ThemedText>
        {opts.trailing ? <Text style={styles.choiceTrailing}>{opts.trailing}</Text> : null}
      </TouchableOpacity>
    );
  };

  /** A yes/no filter as a row: its label, then Alla, Ja and Nej as plain text choices. */
  const triStateRow = (key: TriKey, label: string) => {
    const current = localFilter[key] ?? null;
    return (
      <View key={key} style={styles.choiceRow}>
        <ThemedText style={styles.choiceLabel}>{label}</ThemedText>
        {TRI_OPTIONS.map(option => {
          const selected = current === option.value;
          return (
            <TouchableOpacity
              key={option.label}
              onPress={() => setLocalFilter(prev => ({ ...prev, [key]: option.value }))}
              style={styles.triOption}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label}: ${option.label}`}
            >
              <Text style={[styles.triOptionText, { color: selected ? selectedColor : unselectedColor }, selected && styles.triOptionSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={{
      ...styles.container,
      paddingBottom: bottom,
    }}>
      {/* Overlay - respects safe area */}
      <Animated.View style={[styles.overlay, { 
        opacity: overlayOpacity,
        top: insets.top,
        bottom: 0
      }]}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
      </Animated.View>

      {/* Side Menu */}
      <Animated.View 
        style={[
          styles.sideMenu, 
          { 
            transform: [{ translateX: slideAnim }],
            top: insets.top, // Start below the safe area
            bottom: bottom,
          }
        ]}
      >
        {/* Close button positioned to match filter button location */}
        <FilterButton
          onPress={onClose}
          icon="close"
          style={{
            position: 'absolute',
            top: 5, // Center in the 50px header (since menu already starts below safe area)
            right: 15, // Match headerActions paddingRight
            zIndex: 1001,
          }}
        />
        
        <View style={styles.menuHeader}>
          <ThemedText type='subtitle'>Filtrera aktiviteter</ThemedText>
        </View>

        <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
          {/* Status Filters */}
          {showLocalSection && (
            <View style={styles.section}>
              <ThemedText type='sectionHeader'>Lokala träffar</ThemedText>
              {choiceRow({
                key: 'all', label: 'Alla', kind: 'radio',
                selected: draftLocal.mode === 'all',
                onPress: () => setDraftLocal({ mode: 'all' }),
              })}
              {choiceRow({
                key: 'regions', label: 'Lokalavdelning', kind: 'radio',
                selected: draftLocal.mode === 'regions',
                onPress: () => setDraftLocal({ mode: 'regions', regions: lastRegions }),
              })}
              {draftLocal.mode === 'regions' && localGroups.map(group => choiceRow({
                key: `region-${group.key}`, label: group.label, kind: 'check', indent: true,
                selected: draftLocal.regions.includes(group.key),
                onPress: () => toggleRegion(group.key),
                trailing: String(group.count),
              }))}
              {choiceRow({
                key: 'distance', label: 'Avstånd från mig', kind: 'radio',
                selected: draftLocal.mode === 'distance',
                onPress: () => setDraftLocal({ mode: 'distance', km: 50 }),
                disabled: !hasUserPosition && draftLocal.mode !== 'distance',
              })}
              {!hasUserPosition && (
                <ThemedText style={styles.choiceHint}>
                  Kräver att appen får använda din position.
                </ThemedText>
              )}
              {draftLocal.mode === 'distance' && DISTANCE_OPTIONS_KM.map(km => choiceRow({
                key: `km-${km}`, label: `Inom ${km} km`, kind: 'radio', indent: true,
                selected: draftLocal.km === km,
                onPress: () => setDraftLocal({ mode: 'distance', km }),
              }))}
              {draftLocal.mode === 'distance' && (
                <ThemedText style={styles.choiceHint}>
                  Träffar utan plats räknas från lokalavdelningens ort.
                </ThemedText>
              )}
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type='sectionHeader'>Status</ThemedText>
            {triStateRow('attendingOrHost', 'Deltagande')}
            {triStateRow('bookable', 'Bokningsbar')}
            {triStateRow('official', 'Officiell')}
          </View>

          {/* Date Range Filters */}
          <View style={styles.section}>
            <ThemedText type='sectionHeader'>Tidsintervall</ThemedText>

              <DatepickerField
                label="Från"
                date={localFilter.dateFrom || undefined}
                placeholder="Nu"
                onDateChange={handleDateFromChange}
              />

              <DatepickerField
                label="Till"
                date={localFilter.dateTo || undefined}
                minimumDate={localFilter.dateFrom || undefined}
                onDateChange={handleDateToChange}
              />
          </View>

          {/* Category Filters */}
          <View style={styles.section}>
            <ThemedText type='sectionHeader'>Kategorier</ThemedText>
            {EVENT_CATEGORIES.map((category) => {
              const isSelected = localFilter.categories?.includes(category.code) ?? false;
              return (
                <TouchableOpacity
                  key={category.code}
                  style={styles.choiceRow}
                  onPress={() => toggleCategory(category.code)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <MaterialIcons name={category.icon} size={22} color={category.color} />
                  <ThemedText style={styles.choiceLabel}>{category.label}</ThemedText>
                  {isSelected && <MaterialIcons name="check" size={20} color={selectedColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={handleReset}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>
              Rensa filter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSolid]}
            onPress={handleApply}
          >
            <Text style={[styles.buttonText, styles.buttonTextSolid]}>
              Tillämpa
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  overlayPressable: {
    flex: 1,
  },
  sideMenu: {
    position: 'absolute',
    right: 0,
    width: screenWidth * 0.75,
    backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 30, 
    borderBottomColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary200,
  },
  menuContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 18,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 10,
  },
  choiceRowIndent: {
    paddingLeft: 28,
  },
  choiceRowDisabled: {
    opacity: 0.5,
  },
  choiceLabel: {
    flex: 1,
    fontSize: 15,
  },
  choiceTrailing: {
    fontSize: 13,
    color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
  },
  triOption: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triOptionText: {
    fontSize: 15,
  },
  triOptionSelected: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  choiceHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? Colors.primary300 : '#005DB4',
    backgroundColor: 'transparent',
  },
  buttonSolid: {
    backgroundColor: '#005DB4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: colorScheme === 'dark' ? Colors.primary300 : '#005DB4',
  },
  buttonTextSolid: {
    color: '#ffffff',
  },
});