import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { EVENT_CATEGORIES } from '../utilities/EventCategories';
import { FilterButton } from './FilterButton';
import OfficialEventIcon from '../../../components/icons/OfficialEventIcon';
import { DatepickerField } from '@/features/common/components/inputs/DatepickerField';
import { EventFilterOptions } from '../store/EventsSlice';
import { ThemedText } from '@/components/ThemedText';

const { width: screenWidth } = Dimensions.get('window');

interface EventFilterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filter: EventFilterOptions) => void;
  currentFilter: EventFilterOptions;
}

export const EventFilter: React.FC<EventFilterProps> = ({
  visible,
  onClose,
  onApplyFilter,
  currentFilter,
}) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [localFilter, setLocalFilter] = useState<EventFilterOptions>(currentFilter);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.75)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalFilter(currentFilter);
  }, [currentFilter]);

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
    onApplyFilter(localFilter);
    onClose();
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
  };

  const toggleTriStateOption = (
    key: 'attendingOrHost' | 'bookable' | 'official',
    currentValue: boolean | null | undefined
  ) => {
    let newValue: boolean | null;
    if (currentValue === null || currentValue === undefined) {
      newValue = true;
    } else if (currentValue === true) {
      newValue = false;
    } else {
      newValue = null;
    }
    
    setLocalFilter(prev => ({ ...prev, [key]: newValue }));
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

  const getTriStateLabel = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return 'Alla';
    return value ? 'Ja' : 'Nej';
  };

  const getTriStateColor = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return colorScheme === 'dark' ? '#6b7280' : '#9ca3af';
    return value ? Colors.primary300 : '#ef4444';
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

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
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
            bottom: 0 // End above the safe area
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
          <View style={styles.section}>
            <ThemedText type='sectionHeader'>Status</ThemedText>
            
            <View style={styles.filterRow}>
              <ThemedText>Deltagande</ThemedText>
              <TouchableOpacity
                style={[styles.triStateButton, { borderColor: getTriStateColor(localFilter.attendingOrHost) }]}
                onPress={() => toggleTriStateOption('attendingOrHost', localFilter.attendingOrHost)}
              >
                <Text style={[styles.triStateButtonText, { color: getTriStateColor(localFilter.attendingOrHost) }]}>
                  {getTriStateLabel(localFilter.attendingOrHost)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <ThemedText >Bokningsbar</ThemedText>
              <TouchableOpacity
                style={[styles.triStateButton, { borderColor: getTriStateColor(localFilter.bookable) }]}
                onPress={() => toggleTriStateOption('bookable', localFilter.bookable)}
              >
                <Text style={[styles.triStateButtonText, { color: getTriStateColor(localFilter.bookable) }]}>
                  {getTriStateLabel(localFilter.bookable)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterLabelContainer}>
                <ThemedText>Officiell</ThemedText>
                <View style={{ marginLeft: 4 }}>
                  <OfficialEventIcon size={14} color={getTriStateColor(localFilter.official)} />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.triStateButton, { borderColor: getTriStateColor(localFilter.official) }]}
                onPress={() => toggleTriStateOption('official', localFilter.official)}
              >
                <Text style={[styles.triStateButtonText, { color: getTriStateColor(localFilter.official) }]}>
                  {getTriStateLabel(localFilter.official)}
                </Text>
              </TouchableOpacity>
            </View>
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
            <View style={styles.categoryGrid}>
              {EVENT_CATEGORIES.map((category) => {
                const isSelected = localFilter.categories?.includes(category.code) ?? false;
                return (
                  <TouchableOpacity
                    key={category.code}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: isSelected ? category.color : 'transparent',
                        borderColor: category.color,
                      }
                    ]}
                    onPress={() => toggleCategory(category.code)}
                  >
                    <View style={styles.categoryButtonContent}>
                      <MaterialIcons 
                        name={category.icon} 
                        size={16} 
                        color={isSelected ? '#ffffff' : category.color} 
                      />
                      <Text style={[
                        styles.categoryButtonText,
                        { color: isSelected ? '#ffffff' : category.color }
                      ]}>
                        {category.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: colorScheme === 'dark' ? '#d1d5db' : '#374151',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  triStateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
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
    borderColor: Colors.primary300,
    backgroundColor: 'transparent',
  },
  buttonSolid: {
    backgroundColor: Colors.primary500,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: Colors.primary300,
  },
  buttonTextSolid: {
    color: '#ffffff',
  },
});