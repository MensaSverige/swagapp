import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ title: 'Integritet & delning', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="app-settings" options={{ title: 'Appinställningar', headerBackTitle: 'Profil' }} />
    </Stack>
  );
}
