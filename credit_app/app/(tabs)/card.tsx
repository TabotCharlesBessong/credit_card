import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '@/components/ui/Card';
import AppLineChart from '@/components/charts/LineChart';
import AppBarChart from '@/components/charts/BarChart';
import { ThemedText } from '@/components/themed-text';

const CardScreen = () => {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [60, 30, 70, 45, 80, 55],
      },
    ],
  };

  return (
    <ScrollView style={styles.scrollViewContent}>
      <View style={styles.container}>
        <ThemedText type="title">Card Screen - Component Showcase</ThemedText>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Line Chart Example</ThemedText>
          <AppLineChart data={chartData} title="Card Usage Trends" />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Bar Chart Example</ThemedText>
          <AppBarChart data={chartData} title="Monthly Spending" />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Card Information</ThemedText>
          <ThemedText type="default">Card Number: **** **** **** 1234</ThemedText>
          <ThemedText type="default">Card Holder: John Doe</ThemedText>
          <ThemedText type="default">Expiry Date: 12/25</ThemedText>
          <ThemedText type="caption">Last updated: 2 minutes ago</ThemedText>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
  },
});

export default CardScreen;
