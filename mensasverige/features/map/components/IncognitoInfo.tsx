import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useStore from '../../common/store/store';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const createStyles = (colorMode: string) => StyleSheet.create({
  container: {
    backgroundColor: colorMode === 'dark' ? '#374151' : '#f9fafb',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 30,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    marginRight: 30,
    flex: 1,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colorMode === 'dark' ? Colors.primary200 : Colors.primary600,
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: colorMode === 'dark' ? '#e5e7eb' : '#374151',
    lineHeight: 20,
  },
});

const IncognitoInfo: React.FC = () => {   
    const { user } = useStore();
    const colorScheme = useColorScheme();
    const colorMode = colorScheme ?? 'light';
    const styles = createStyles(colorMode);

    if (!user || user.settings.show_location !== "NO_ONE") {
        return null;
    }
    
    return (
        <View style={styles.container}>
            <MaterialIcons
                name="visibility-off"
                size={30} 
                color={colorMode === 'dark' ? '#60a5fa' : '#3b82f6'} 
            />
            <View style={styles.textContainer}>
                <Text style={styles.heading}>Inkognito</Text>
                <Text style={styles.text}>
                    Andra kan inte se dig på kartan, och du kan bara se de som valt att dela sin position publikt.
                </Text>
            </View>
        </View>
    );
};

export default IncognitoInfo;