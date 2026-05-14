import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ title: 'Integritet & delning', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="app-settings" options={{ title: 'Appinställningar', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="interests" options={{ title: 'Intressen', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="feedback/index" options={{ title: 'Feedback & idéer', headerBackTitle: 'Profil' }} />
      <Stack.Screen name="feedback/[number]" options={{ title: 'Inlägg', headerBackTitle: 'Tillbaka' }} />
    </Stack>
  );
}
