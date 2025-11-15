import React from 'react';
import { StyleSheet } from 'react-native';
import useStore from '../../common/store/store';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  container: {
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
});

const IncognitoInfo: React.FC = () => {
  const { user } = useStore();

  if (user?.settings.show_location !== "NO_ONE") {
    return null;
  }

  return (
    <ThemedView
      style={styles.container}
    >
      <MaterialIcons
        name="visibility-off"
        size={30}
        color={Colors.primary400}
      />
      <ThemedView style={styles.textContainer}>
        <ThemedText type="subtitle">
          Inkognito
        </ThemedText>
        <ThemedText>
          Andra kan inte se dig på kartan, och du kan bara se de som valt att dela sin position publikt.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

export default IncognitoInfo;