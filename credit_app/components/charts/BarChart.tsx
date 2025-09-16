import React from 'react';
import { Dimensions, View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface BarChartProps {
  data: { labels: string[]; datasets: { data: number[] }[] };
  chartConfig?: any; // Customize chart appearance
  title?: string;
}

const AppBarChart: React.FC<BarChartProps> = ({ data, chartConfig, title }) => {
  const defaultChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2, // optional, defaults to 2dp
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <BarChart
        data={data}
        width={screenWidth - 30} // from react-native
        height={220}
        chartConfig={chartConfig || defaultChartConfig}
        style={styles.chart}
        verticalLabelRotation={30}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AppBarChart;
