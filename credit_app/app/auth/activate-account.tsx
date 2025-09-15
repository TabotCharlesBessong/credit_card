import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import Card from '@/components/ui/Card';
import { useDispatch, useSelector } from 'react-redux';
import { activateAccount, clearMessages } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';

const ActivateAccountScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, message } = useSelector((state: RootState) => state.auth);
  const { token } = useLocalSearchParams();
  const [activationAttempted, setActivationAttempted] = useState(false);

  useEffect(() => {
    if (token && !activationAttempted) {
      dispatch(activateAccount({ token: token as string }));
      setActivationAttempted(true);
    }

    return () => {
      dispatch(clearMessages());
    };
  }, [token, activationAttempted, dispatch]);

  useEffect(() => {
    if (message === 'Account activated successfully!' && !error) {
      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => router.replace('/auth/sign-in') },
      ]);
    } else if (error && activationAttempted) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => router.replace('/auth/sign-up') },
      ]);
    }
  }, [message, error, activationAttempted]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Card style={styles.card}>
        <ThemedText type="title" style={styles.title}>Account Activation</ThemedText>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Activating your account...</ThemedText>
          </View>
        ) : (
          <View>
            {message && <ThemedText style={styles.successText} type="caption">{message}</ThemedText>}
            {error && <ThemedText style={styles.errorText} type="caption">{error}</ThemedText>}
            {!token && <ThemedText style={styles.infoText}>No activation token found. Please check your email for the activation link.</ThemedText>}
            {(!isLoading && (error || !token)) && (
              <Button title="Go to Sign Up" onPress={() => router.replace('/auth/sign-up')} />
            )}
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  successText: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
  },
});

export default ActivateAccountScreen;
