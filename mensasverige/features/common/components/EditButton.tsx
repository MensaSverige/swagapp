import React from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';

export const EditButton: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  const colorScheme = useColorScheme();
  const styles = createStyles(colorScheme);

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}>
      <MaterialIcons 
        name="edit" 
        size={20} 
        color={Colors[colorScheme ?? 'light'].primary500} 
      />
    </Pressable>
  );
};

const createStyles = (colorScheme: 'light' | 'dark' | null | undefined) => 
  StyleSheet.create({
    button: {
      padding: 16,
    },
  });
