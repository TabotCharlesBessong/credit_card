import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { createCard } from '../../store/cardSlice';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth';
import { Stack } from 'expo-router';

const CreateCardScreen = ({ navigation }: any) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [creditLimit, setCreditLimit] = useState('');

  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.card);
  const { userToken } = useAuth();

  const handleSubmit = async () => {
    if (!userToken) {
      Alert.alert('Error', 'You must be logged in to create a card.');
      return;
    }

    if (!cardNumber || !expiryMonth || !expiryYear || !creditLimit) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const cardData = {
      cardNumber,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      creditLimit: parseFloat(creditLimit),
    };

    try {
      await dispatch(createCard({ cardData, token: userToken })).unwrap();
      Alert.alert('Success', 'Credit card created successfully!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create card.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Create New Card' }} />
      <ThemedText type="title" style={styles.title}>Create New Credit Card</ThemedText>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Card Number</ThemedText>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          placeholder="Enter 16-digit card number"
          maxLength={16}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Expiry Month</ThemedText>
        <TextInput
          style={styles.input}
          value={expiryMonth}
          onChangeText={setExpiryMonth}
          keyboardType="numeric"
          placeholder="MM"
          maxLength={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Expiry Year</ThemedText>
        <TextInput
          style={styles.input}
          value={expiryYear}
          onChangeText={setExpiryYear}
          keyboardType="numeric"
          placeholder="YYYY"
          maxLength={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Credit Limit</ThemedText>
        <TextInput
          style={styles.input}
          value={creditLimit}
          onChangeText={setCreditLimit}
          keyboardType="numeric"
          placeholder="e.g., 5000.00"
        />
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Card</Text>
        )}
      </TouchableOpacity>

      {error && <ThemedText style={styles.errorText}>Error: {error}</ThemedText>}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});

export default CreateCardScreen;
