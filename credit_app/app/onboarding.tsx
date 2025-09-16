import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Stack, router } from 'expo-router';

const OnboardingScreen = () => {
  const handleOnboardingComplete = () => {
    // In a real app, you would set an onboarding flag here (e.g., in AsyncStorage)
    // For now, we'll just navigate to the main tabs.
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Welcome to Credit App!</Text>
      <Text style={styles.subtitle}>Your personal financial manager.</Text>
      <Button title="Get Started" onPress={handleOnboardingComplete} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
});

export default OnboardingScreen;
