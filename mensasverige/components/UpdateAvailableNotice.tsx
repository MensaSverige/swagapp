import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
import { SafeAreaView } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 44;

interface EasUpdateBannerProps {
  style?: ViewStyle;
}

export const UpdateAvailableNotice: React.FC<EasUpdateBannerProps> = ({ style }) => {
  // const { isUpdateAvailable, isChecking, isDownloading } = useUpdates();
  // TODO: Don't fake these three values:
  const isUpdateAvailable = true;
  const isChecking = false;
  const isDownloading = false;
  
  const [showBanner, setShowBanner] = useState(false);
  const [isUpdatingNow, setIsUpdatingNow] = useState(false);

  const heightAnim = useRef(new Animated.Value(0)).current;

  // Sync banner visibility with hook state
  useEffect(() => {
    if (isUpdateAvailable) {
      setShowBanner(true);
    }
  }, [isUpdateAvailable]);

  // Periodically check for updates
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const checkForUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        setShowBanner(result.isAvailable);
      } catch (e) {
        console.warn('Failed to check for EAS update', e);
      }
    };

    checkForUpdate();
    intervalId = setInterval(checkForUpdate, 30 * 60 * 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Animate height
  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: showBanner ? BANNER_HEIGHT : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showBanner, heightAnim]);

  const handleUpdatePress = async () => {
    try {
      setIsUpdatingNow(true);

      const checkResult = await Updates.checkForUpdateAsync();
      if (!checkResult.isAvailable) {
        setShowBanner(false);
        return;
      }

      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      // If successful, reloadAsync never resolves
    } catch (err) {
      console.warn('EAS update failed', err);
      // Keep banner so user can try again if you like
    } finally {
      setIsUpdatingNow(false);
    }
  };

  // If height is 0, we still render the Animated.View so the animation can run
  return (
    <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.container, { height: heightAnim }, style]}>
        {showBanner && (
            <>
            <Text style={styles.text}>Det finns en ny uppdatering!</Text>

            <Pressable
                onPress={handleUpdatePress}
                disabled={isUpdatingNow || isChecking || isDownloading}
                style={styles.button}
            >
                {isUpdatingNow || isChecking || isDownloading ? (
                <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                <Text style={styles.buttonText}>Uppdatera</Text>
                )}
            </Pressable>
            </>
        )}
        </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  text: {
    color: 'white',
    flex: 1,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
