import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LocationLinkProps, openLocation } from '../functions/openLocation';
import { useColorScheme } from '@/hooks/useColorScheme';

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

/**
 * An address a member can open in their map app.
 *
 * `approximate` is for a place the backend geocoded rather than a venue
 * somebody typed: it still opens a map search, which is honest for a postal
 * code, but it does not offer directions to a city centre as if that were the
 * address. Docs: docs/Events.md
 */
export const AddressLinkAndIcon: React.FC<
  LocationLinkProps & { approximate?: boolean }
> = (props) => {
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
                    name={props.approximate ? 'place' : 'directions'} 
                    size={18} 
                    color={colorMode === 'dark' ? '#60a5fa' : '#3b82f6'} 
                />
            </View>
        </TouchableOpacity>
    );
};