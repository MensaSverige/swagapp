import React from 'react';
import { Platform, Linking, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LocationLinkProps, openLocation } from '../functions/openLocation';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const createStyles = (colorMode: string) => StyleSheet.create({
  container: {
    height: 50,
    width: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: colorMode === 'dark' ? '#60a5fa' : '#3b82f6',
    fontSize: 16,
  },
});

export const AddressLinkAndIcon: React.FC<LocationLinkProps> = (props) => {
    const colorScheme = useColorScheme();
    const colorMode = colorScheme ?? 'light';
    const styles = createStyles(colorMode);

    if (!props.displayName) {
        return null;
    }

    return (
        <TouchableOpacity style={styles.container} onPress={() => openLocation(props)}>
            <View style={styles.content}>
                <Text style={styles.text}>
                    {props.displayName}
                </Text>
                <MaterialIcons 
                    name="directions" 
                    size={18} 
                    color={colorMode === 'dark' ? '#60a5fa' : '#3b82f6'} 
                />
            </View>
        </TouchableOpacity>
    );
};