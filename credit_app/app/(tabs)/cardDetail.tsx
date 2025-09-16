import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchCardById, blockCard, clearSelectedCard } from '../../store/cardSlice';
import { CardStatus } from '../../constants/enums';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth';

const CardDetailScreen = ({ navigation }: any) => {
  const { cardId } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { selectedCard, loading, error } = useAppSelector((state) => state.card);
  const { userToken } = useAuth();

  useEffect(() => {
    if (cardId && userToken) {
      dispatch(fetchCardById({ id: Number(cardId), token: userToken }));
    }
    return () => {
      dispatch(clearSelectedCard());
    };
  }, [dispatch, cardId, userToken]);

  const handleBlockCard = () => {
    if (selectedCard && userToken) {
      dispatch(blockCard({ id: selectedCard.id, token: userToken }));
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </ThemedView>
    );
  }

  if (!selectedCard) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No card selected or found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Card Details</ThemedText>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Card Number:</ThemedText>
        <ThemedText style={styles.value}>**** **** **** {selectedCard.cardNumber.slice(-4)}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Card Holder:</ThemedText>
        <ThemedText style={styles.value}>{selectedCard.cardHolderName}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Expires:</ThemedText>
        <ThemedText style={styles.value}>{selectedCard.expiryMonth}/{selectedCard.expiryYear}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Current Balance:</ThemedText>
        <ThemedText style={styles.value}>${selectedCard.currentBalance.toFixed(2)}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Credit Limit:</ThemedText>
        <ThemedText style={styles.value}>${selectedCard.creditLimit.toFixed(2)}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Status:</ThemedText>
        <ThemedText style={selectedCard.status === CardStatus.BLOCKED ? styles.statusBlocked : styles.statusActive}>
          {selectedCard.status}
        </ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText style={styles.label}>Card Type:</ThemedText>
        <ThemedText style={styles.value}>{selectedCard.cardType}</ThemedText>
      </View>

      {selectedCard.status !== CardStatus.BLOCKED && ( // Only show block button if not already blocked
        <TouchableOpacity style={styles.blockButton} onPress={handleBlockCard}>
          <Text style={styles.buttonText}>Block Card</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
  },
  statusActive: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  statusBlocked: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
  },
  blockButton: {
    backgroundColor: '#DC3545',
    padding: 15,
    borderRadius: 5,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default CardDetailScreen;
