import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const PaymentStatusScreen = () => {
  const { redirectUrl } = useLocalSearchParams();
  const [statusMessage, setStatusMessage] = useState('Redirecting to payment gateway...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (redirectUrl) {
        try {
          // For web, directly open the URL. For native, use Linking.openURL
          // This is a simplified approach. In a real app, you might use InAppBrowser
          // or more sophisticated methods to handle redirects within the app.
          console.log('Opening Fapshi redirect URL:', redirectUrl);
          await Linking.openURL(redirectUrl as string);
          setStatusMessage('Please complete your payment on the Fapshi page.');
        } catch (e: any) {
          console.error('Failed to open redirect URL:', e);
          setError('Could not open payment gateway. Please try again.');
          setStatusMessage('Payment initiation failed.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('No redirect URL provided.');
        setStatusMessage('Payment initiation failed.');
        setIsLoading(false);
      }
    };

    handleRedirect();
  }, [redirectUrl]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Payment Status' }} />
      <ThemedText type="title" style={styles.title}>Payment Status</ThemedText>
      
      {isLoading && <ActivityIndicator size="large" />}
      <ThemedText style={styles.message}>{statusMessage}</ThemedText>
      {error && <ThemedText style={styles.errorText}>Error: {error}</ThemedText>}

      {!isLoading && !error && (
        <ThemedText style={styles.instructionText}>
          You will be redirected to Fapshi to complete your payment. Please do not close this app until the payment is finalized.
        </ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PaymentStatusScreen;
