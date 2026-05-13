import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { Colors } from '@/constants/Colors';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const BackgroundLocationDisclosure: React.FC<Props> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const overlay = colorScheme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: overlay }]}>
        <ThemedView style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}>
            <ThemedText type="title" style={styles.title}>
              Dela plats i bakgrunden
            </ThemedText>

            <ThemedText style={styles.body}>
              Mensa Sverige-appen kan dela din plats med andra Mensamedlemmar
              på kartan även när appen är stängd eller i bakgrunden.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Vad samlas in
            </ThemedText>
            <ThemedText style={styles.body}>
              Din exakta plats (latitud och longitud) skickas till Mensa
              Sveriges server och visas på kartan för andra inloggade
              medlemmar enligt dina sekretessinställningar.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              När den används
            </ThemedText>
            <ThemedText style={styles.body}>
              Platsen uppdateras enligt det intervall du valt under
              Platsuppdatering. Med bakgrundsdelning aktiverad fortsätter
              uppdateringarna även när du inte aktivt använder appen.
            </ThemedText>

            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Din kontroll
            </ThemedText>
            <ThemedText style={styles.body}>
              Du kan stänga av bakgrundsdelning när som helst i den här
              vyn. Du styr också vem som ser din plats under Sekretess.
            </ThemedText>

            <ThemedText style={styles.note}>
              Om du fortsätter visar din enhet en systemfråga där du
              väljer hur appen får använda platstjänster.
            </ThemedText>

            <View style={styles.buttons}>
              <ThemedButton
                text="Avbryt"
                variant="secondary"
                onPress={onCancel}
                style={styles.button}
              />
              <ThemedButton
                text="Fortsätt"
                variant="primary"
                onPress={onConfirm}
                style={styles.button}
              />
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  scroll: {
    padding: 24,
  },
  title: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.65,
    lineHeight: 17,
  },
  buttons: {
    marginTop: 24,
    gap: 10,
  },
  button: {},
});

export default BackgroundLocationDisclosure;
