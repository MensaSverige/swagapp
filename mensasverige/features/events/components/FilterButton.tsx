import React from 'react';
import { TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface FilterButtonProps {
  onPress: () => void;
  isActive?: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  style?: any;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  onPress,
  isActive = false,
  icon,
  size = 20,
  style
}) => {
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme ?? 'light');

  const getIconColor = () => {
    if (isActive) {
      return Colors.white;
    }
    return colorScheme === 'dark' ? Colors.coolGray300 : Colors.primary600;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterButton,
        isActive && styles.filterButtonActive,
        style
      ]}
    >
      <MaterialIcons 
        name={icon} 
        size={size} 
        color={getIconColor()} 
      />
    </TouchableOpacity>
  );
};

const createStyles = (colorScheme: string) => StyleSheet.create({
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorScheme === 'dark' ? Colors.background800 : Colors.background50,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary600,
  },
});