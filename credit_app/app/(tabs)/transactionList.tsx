import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchCardTransactions } from '../../store/transactionSlice';
import { Transaction } from '../../types/transaction';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAuth } from '../../hooks/useAuth';

const TransactionListScreen = ({ navigation }: any) => {
  const { cardId } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { transactions, loading, error } = useAppSelector((state) => state.transaction);
  const { userToken } = useAuth();

  useEffect(() => {
    if (cardId && userToken) {
      dispatch(fetchCardTransactions({ cardId: Number(cardId), token: userToken }));
    }
  }, [dispatch, cardId, userToken]);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <ThemedView style={styles.transactionContainer}>
      <View style={styles.row}>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
        <ThemedText style={item.type === 'DEBIT' ? styles.debitAmount : styles.creditAmount}>
          {item.type === 'DEBIT' ? '-' : '+'}${item.amount.toFixed(2)}
        </ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.merchant}>{item.merchant || 'N/A'}</ThemedText>
        <ThemedText style={styles.status}>Status: {item.status}</ThemedText>
      </View>
      <ThemedText style={styles.date}>{new Date(item.transactionDate).toLocaleDateString()}</ThemedText>
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
      <ThemedText type="title" style={styles.title}>Transactions</ThemedText>
      {transactions.length === 0 ? (
        <ThemedText style={styles.noTransactionsText}>No transactions found for this card.</ThemedText>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
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
  transactionContainer: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  merchant: {
    fontSize: 14,
    color: '#666',
  },
  debitAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  noTransactionsText: {
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

export default TransactionListScreen;
