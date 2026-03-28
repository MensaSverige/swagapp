import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { openStoreUrl } from '../functions/openStoreUrl';
import { Colors } from '@/constants/Colors';
import useStore from '@/features/common/store/store';


export const UpdateRequiredModal: React.FC = () => {
  const { requiredUpdateInfo } = useStore();

  if (!requiredUpdateInfo) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Uppdatering krävs</Text>
          <Text style={styles.message}>{`En ny version (${requiredUpdateInfo.latestVersion || ''}) är tillgänglig.`}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => openStoreUrl(requiredUpdateInfo.storeUrl ?? undefined)}
          >
            <Text style={styles.buttonText}>
              Uppdatera nu
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: Colors.background100,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.text0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.primary500,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
