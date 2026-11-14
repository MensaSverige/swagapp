import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventHeaderVisible } from '../hooks/useEventHeaderVisible';
import { EVENT_HEADER_BG } from '../styles/typeScale';

/**
 * The app's single status bar style: light icons while the blue EventHeader
 * is on screen, otherwise following the colour scheme. Kept in one place
 * because the last mounted StatusBar wins.
 */
export const AppStatusBar: React.FC = () => {
  const headerVisible = useEventHeaderVisible();
  return <StatusBar style={headerVisible ? 'light' : 'auto'} />;
};

/**
 * Paints the status bar strip above the EventHeader blue, so the header
 * reaches the top of the screen. Render it inside the tab layout's top
 * SafeAreaView, whose padding is that strip.
 */
export const EventHeaderStatusBarBackdrop: React.FC = () => {
  const headerVisible = useEventHeaderVisible();
  const { top } = useSafeAreaInsets();
  if (!headerVisible || top === 0) return null;
  return <View pointerEvents="none" style={[styles.backdrop, { height: top }]} />;
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: EVENT_HEADER_BG,
  },
});
