import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { Provider , useDispatch, useSelector } from 'react-redux';
import { store, RootState, AppDispatch } from '@/store';
import { loadUserToken } from '@/store/authSlice';

import { useColorScheme } from '@/hooks/use-color-scheme';

// No need for unstable_settings.anchor when managing routes conditionally in RootLayout
// export const unstable_settings = {
//   anchor: '(tabs)',
// };

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const [isOnboarded, setIsOnboarded] = useState(false); // Simulate onboarding status
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Load user token from AsyncStorage
        await dispatch(loadUserToken());
        // In a real app, you would also check AsyncStorage for onboarding status
        // For now, we'll simulate it.
        // const onboardingStatus = await AsyncStorage.getItem('onboardingComplete');
        // setIsOnboarded(onboardingStatus === 'true');
        setIsOnboarded(false); // Force onboarding for demonstration
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    };
    prepareApp();
  }, [dispatch]);

  useEffect(() => {
    if (isAppReady) {
      if (!isOnboarded) {
        (router.replace as any)('/onboarding');
      } else if (token) {
        (router.replace as any)('/(tabs)');
      } else {
        (router.replace as any)('/(auth)/sign-in');
      }
    }
  }, [token, isOnboarded, isAppReady]);

  if (!isAppReady) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {isOnboarded ? (
          <Stack.Screen name="onboarding" />
        ) : token ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}
