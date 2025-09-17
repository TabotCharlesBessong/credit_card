import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  topUpMobileMoney,
  topUpOrangeMoney,
  topUpBankAccount,
  sendToMobileMoney,
  sendToOrangeMoney,
  sendToBankAccount,
  processCardPayment,
} from '../../store/transactionSlice';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth';
import { Stack } from 'expo-router';
import { CreditCard } from '../../types/card'; // Assuming you want to select a card
import { Picker } from '@react-native-picker/picker'; // For card selection
import { TopUpData, SendMoneyData, CardPaymentData } from '../../types/transaction'; // Added types for payload

const PaymentScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { userToken } = useAuth();
  const { loading, error } = useAppSelector((state) => state.transaction);
  const { cards } = useAppSelector((state) => state.card); // Assuming cards are loaded in cardSlice

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipientDetails, setRecipientDetails] = useState(''); // For top-up/send money
  const [merchant, setMerchant] = useState(''); // For card payments
  const [phoneNumber, setPhoneNumber] = useState(''); // For mobile money payments
  const [paymentType, setPaymentType] = useState('topUpMobile'); // Default payment type

  const handlePayment = async () => {
    if (!userToken) {
      Alert.alert('Error', 'You must be logged in to make a payment.');
      return;
    }
    if (!selectedCardId) {
      Alert.alert('Error', 'Please select a credit card.');
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid positive amount.');
      return;
    }
    if (!description) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }

    // Validate phone number if applicable
    if ((paymentType.includes('Mobile') || paymentType.includes('Orange')) && !phoneNumber) {
      Alert.alert('Error', 'Phone number is required for mobile money payments.');
      return;
    }

    const parsedAmount = parseFloat(amount);

    let payload: any;

    switch (paymentType) {
      case 'topUpMobile':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails, phoneNumber };
        break;
      case 'topUpOrange':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails, phoneNumber };
        break;
      case 'topUpBank':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails };
        break;
      case 'sendMobile':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails, phoneNumber };
        break;
      case 'sendOrange':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails, phoneNumber };
        break;
      case 'sendBank':
        if (!recipientDetails) return Alert.alert('Error', 'Recipient details are required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, recipientDetails };
        break;
      case 'cardPayment':
        if (!merchant) return Alert.alert('Error', 'Merchant is required.');
        payload = { cardId: selectedCardId, amount: parsedAmount, description, merchant };
        break;
      default:
        Alert.alert('Error', 'Invalid payment type selected.');
        return;
    }

    try {
      let result: any;
      switch (paymentType) {
        case 'topUpMobile':
          result = await dispatch(topUpMobileMoney({ topUpData: payload as TopUpData, token: userToken })).unwrap();
          break;
        case 'topUpOrange':
          result = await dispatch(topUpOrangeMoney({ topUpData: payload as TopUpData, token: userToken })).unwrap();
          break;
        case 'topUpBank':
          result = await dispatch(topUpBankAccount({ topUpData: payload as TopUpData, token: userToken })).unwrap();
          break;
        case 'sendMobile':
          result = await dispatch(sendToMobileMoney({ sendMoneyData: payload as SendMoneyData, token: userToken })).unwrap();
          break;
        case 'sendOrange':
          result = await dispatch(sendToOrangeMoney({ sendMoneyData: payload as SendMoneyData, token: userToken })).unwrap();
          break;
        case 'sendBank':
          result = await dispatch(sendToBankAccount({ sendMoneyData: payload as SendMoneyData, token: userToken })).unwrap();
          break;
        case 'cardPayment':
          result = await dispatch(processCardPayment({ cardPaymentData: payload as CardPaymentData, token: userToken })).unwrap();
          break;
        default:
          break;
      }
      
      if (result && result.redirectUrl) {
        // Handle redirect to Fapshi
        navigation.navigate('PaymentStatus', { redirectUrl: result.redirectUrl }); // Navigate to a new screen to handle the redirect
      } else {
        Alert.alert('Success', 'Payment processed successfully!');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process payment.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Make a Payment' }} />
      <ThemedText type="title" style={styles.title}>Make a Payment</ThemedText>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Select Card</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCardId}
              onValueChange={(itemValue) => setSelectedCardId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="-- Select a card --" value={null} />
              {cards.map((card) => (
                <Picker.Item key={card.id} label={`**** ${card.cardNumber.slice(-4)} (${card.cardHolderName})`} value={card.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Payment Type</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentType}
              onValueChange={(itemValue) => setPaymentType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Top-up Mobile Money" value="topUpMobile" />
              <Picker.Item label="Top-up Orange Money" value="topUpOrange" />
              <Picker.Item label="Top-up Bank Account" value="topUpBank" />
              <Picker.Item label="Send to Mobile Money" value="sendMobile" />
              <Picker.Item label="Send to Orange Money" value="sendOrange" />
              <Picker.Item label="Send to Bank Account" value="sendBank" />
              <Picker.Item label="Card Payment" value="cardPayment" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Amount</ThemedText>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g., 100.00"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Monthly grocery shopping"
          />
        </View>

        {(paymentType.includes('Mobile') || paymentType.includes('Orange')) && (
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholder="e.g., 237XXXXXXXXX"
            />
          </View>
        )}

        {(paymentType.includes('topUp') || paymentType.includes('send')) &&
         !(paymentType.includes('Mobile') || paymentType.includes('Orange')) && (
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Recipient Details</ThemedText>
            <TextInput
              style={styles.input}
              value={recipientDetails}
              onChangeText={setRecipientDetails}
              placeholder="e.g., Bank account number"
            />
          </View>
        )}

        {paymentType === 'cardPayment' && (
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Merchant</ThemedText>
            <TextInput
              style={styles.input}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g., Amazon, Starbucks"
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.paymentButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Process Payment</Text>
          )}
        </TouchableOpacity>

        {error && <ThemedText style={styles.errorText}>Error: {error}</ThemedText>}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  paymentButton: {
    backgroundColor: '#007BFF',
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

export default PaymentScreen;
