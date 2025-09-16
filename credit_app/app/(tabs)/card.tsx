import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux'; // Assuming you have these hooks
import { fetchAllCards, blockCard } from '../../store/cardSlice';
import { CreditCard } from '../../types/card';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth'; // Assuming you have an auth hook to get the token
import { CardStatus } from '@/constants/enums';

const CardListScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { cards, loading, error } = useAppSelector((state) => state.card);
  const { userToken } = useAuth(); // Get the authentication token

  useEffect(() => {
    if (userToken) {
      dispatch(fetchAllCards(userToken));
    }
  }, [dispatch, userToken]);

  const handleBlockCard = (id: number) => {
    if (userToken) {
      dispatch(blockCard({ id, token: userToken }));
    }
  };

  const renderCard = ({ item }: { item: CreditCard }) => (
    <ThemedView style={styles.cardContainer}>
      <ThemedText style={styles.cardNumber}>**** **** **** {item.cardNumber.slice(-4)}</ThemedText>
      <ThemedText style={styles.cardHolderName}>{item.cardHolderName}</ThemedText>
      <ThemedText style={styles.cardExpiry}>Expires: {item.expiryMonth}/{item.expiryYear}</ThemedText>
      <ThemedText style={styles.cardBalance}>Balance: ${item.currentBalance.toFixed(2)}</ThemedText>
      <ThemedText style={styles.cardLimit}>Limit: ${item.creditLimit.toFixed(2)}</ThemedText>
      <ThemedText style={item.status === CardStatus.BLOCKED ? styles.cardStatusBlocked : styles.cardStatusActive}>Status: {item.status}</ThemedText>
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
      {item.status !== CardStatus.BLOCKED && (
        <TouchableOpacity
          style={styles.blockButton}
          onPress={() => handleBlockCard(item.id)}
        >
          <Text style={styles.buttonText}>Block Card</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Your Credit Cards</ThemedText>
      {cards.length === 0 ? (
        <ThemedText style={styles.noCardsText}>No credit cards found. Create one now!</ThemedText>
      ) : (
        <FlatList
          data={cards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
      <TouchableOpacity
        style={styles.createCardButton}
        onPress={() => navigation.navigate('CreateCard')}
      >
        <Text style={styles.buttonText}>Create New Card</Text>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  cardContainer: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardHolderName: {
    fontSize: 16,
    marginTop: 5,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cardBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: 'green',
  },
  cardLimit: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
  },
  cardStatusActive: {
    fontSize: 14,
    color: 'green',
    marginTop: 5,
  },
  cardStatusBlocked: {
    fontSize: 14,
    color: 'red',
    marginTop: 5,
  },
  detailsButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#DC3545',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  createCardButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noCardsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default CardListScreen;

