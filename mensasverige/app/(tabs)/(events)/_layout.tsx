import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[id]" options={{ headerBackTitle: 'Aktiviteter' }} />
        <Stack.Screen name="event-form" options={{ headerBackTitle: 'Aktiviteter' }} />
        <Stack.Screen name="user-events" options={{ headerBackTitle: 'Aktiviteter', title: 'Mina bokningar' }} />
      </Stack>
  );
}
