import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const createStyles = (colorScheme: string, topInset: number) => StyleSheet.create({
  searchContainer: {
    backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    marginTop: topInset + 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colorScheme === 'dark' ? '#ffffff' : '#000000',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
});

type SearchParticipantsProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
};

export const SearchParticipants: React.FC<SearchParticipantsProps> = ({ 
  value, 
  onChangeText, 
  onClear, 
  placeholder = "Sök deltagare..." 
}) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colorScheme ?? 'light', insets.top);

  return (
    <View style={styles.searchContainer}>
      <MaterialIcons name="search" size={20} color={Colors.trueGray400 || '#9ca3af'} />
      <TextInput
        style={styles.searchInput}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={Colors.trueGray400 || '#9ca3af'}
        onChangeText={onChangeText}
      />
      {value && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={onClear}
        >
          <MaterialIcons name="close" size={20} color={Colors.trueGray400 || '#9ca3af'} />
        </TouchableOpacity>
      )}
    </View>
  );
};