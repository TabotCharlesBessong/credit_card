import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

// No need for unstable_settings.anchor when managing routes conditionally in RootLayout
// export const unstable_settings = {
//   anchor: '(tabs)',
// };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isOnboarded, setIsOnboarded] = useState(false); // Simulate onboarding status

  useEffect(() => {
    // In a real app, you would check AsyncStorage or another persistent storage
    // to see if the user has completed onboarding.
    // For now, we'll set it to false to always show onboarding initially.
    // setIsOnboarded(true); // Set to true to skip onboarding for testing
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {isOnboarded ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="onboarding" />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
