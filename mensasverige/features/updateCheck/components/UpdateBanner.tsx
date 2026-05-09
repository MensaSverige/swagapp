import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useStore from '@/features/common/store/store';
import { Colors } from '@/constants/Colors';
import { openStoreUrl } from '../functions/openStoreUrl';

export const UpdateBanner: React.FC = () => {
  const { updateAvailableInfo } = useStore();

  if (!updateAvailableInfo) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.bannerContainer}
      onPress={() => openStoreUrl(updateAvailableInfo.storeUrl ?? undefined)}
    >
      <View style={styles.bannerContent}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="system-update" size={18} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>
            Uppdatering tillgänglig
          </Text>
          <Text style={styles.bannerMessage}>
            En ny version av appen finns nu tillgänglig.
          </Text>
        </View>
        <View style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Uppdatera</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: Colors.primary500,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: Colors.text500,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  bannerMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 2,
  },
  bannerButtonText: {
    color: Colors.primary500,
    fontSize: 13,
    fontWeight: '600',
  },
});
