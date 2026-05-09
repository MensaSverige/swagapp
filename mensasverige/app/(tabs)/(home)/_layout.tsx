import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="guide" options={{ title: 'SWAG Guide' }} />
        <Stack.Screen name="[id]" options={{ headerBackTitle: 'Information' }} />
      </Stack>
  );
}
