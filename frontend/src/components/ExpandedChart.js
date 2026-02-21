import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const TIMEFRAMES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

export default function ExpandedChart({ visible, onClose, symbol, stockData }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const theme = useTheme();

  const generateChartData = (timeframe) => {
    const data = [];
    let points = 20;
    
    switch (timeframe) {
      case '1d':
        points = 24; // Hourly data
        break;
      case '1w':
        points = 35; // ~5 hours per point
        break;
      case '1m':
        points = 30; // Daily data
        break;
      case '3m':
        points = 90; // Daily data
        break;
      case '1y':
        points = 52; // Weekly data
        break;
      case 'all':
        points = 100; // Monthly data
        break;
    }

    const baseValue = stockData?.price || 100;
    const isPositive = stockData?.changePercent >= 0;
    
    for (let i = 0; i < points; i++) {
      const change = isPositive 
        ? Math.random() * 10 
        : -Math.random() * 10;
      const trend = isPositive ? (i * 0.5) : -(i * 0.5);
      data.push(baseValue + change + trend);
    }
    
    return data;
  };

  const chartData = generateChartData(selectedTimeframe);
  const chartColor = stockData?.changePercent >= 0 ? theme.colors.positive : theme.colors.negative;
  const labels = Array(chartData.length).fill('');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.symbol, { color: theme.colors.text }]}>
              {symbol}
            </Text>
            {stockData && (
              <View style={styles.priceContainer}>
                <Text style={[styles.price, { color: theme.colors.text }]}>
                  ${stockData.price?.toFixed(2)}
                </Text>
                <View style={[
                  styles.changeBadge,
                  { 
                    backgroundColor: stockData.changePercent >= 0 
                      ? 'rgba(52, 199, 89, 0.15)' 
                      : 'rgba(255, 59, 48, 0.15)' 
                  }
                ]}>
                  <Text style={[
                    styles.changeText,
                    { 
                      color: stockData.changePercent >= 0 
                        ? theme.colors.positive 
                        : theme.colors.negative 
                    }
                  ]}>
                    {stockData.changePercent >= 0 ? '+' : ''}
                    {stockData.changePercent?.toFixed(2)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
          <Button
            mode="text"
            onPress={onClose}
            textColor={theme.colors.text}
            labelStyle={{ fontSize: 18 }}
          >
            ✕
          </Button>
        </View>

        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf.value}
              onPress={() => setSelectedTimeframe(tf.value)}
              style={[
                styles.timeframeButton,
                {
                  backgroundColor: selectedTimeframe === tf.value
                    ? theme.colors.primary
                    : theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeframeText,
                  {
                    color: selectedTimeframe === tf.value
                      ? '#000'
                      : theme.colors.text,
                    fontWeight: selectedTimeframe === tf.value ? '700' : '500',
                  },
                ]}
              >
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView 
          style={styles.chartContainer}
          contentContainerStyle={styles.chartContent}
        >
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
            <LineChart
              data={{
                labels: labels,
                datasets: [
                  {
                    data: chartData,
                    color: () => chartColor,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 32}
              height={screenHeight * 0.6}
              withDots={false}
              withShadow={true}
              withVerticalLines={true}
              withHorizontalLines={true}
              withInnerLines={true}
              withOuterLines={true}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 2,
                color: () => chartColor,
                labelColor: () => theme.colors.placeholder,
                style: {
                  borderRadius: 16,
                },
                propsForBackgroundLines: {
                  strokeWidth: 0.5,
                  stroke: theme.colors.border,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: chartColor,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
              Chart Statistics
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
                  High
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  ${Math.max(...chartData).toFixed(2)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
                  Low
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  ${Math.min(...chartData).toFixed(2)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
                  Change
                </Text>
                <Text style={[
                  styles.statValue,
                  { 
                    color: chartData[chartData.length - 1] >= chartData[0]
                      ? theme.colors.positive
                      : theme.colors.negative
                  }
                ]}>
                  {chartData[chartData.length - 1] >= chartData[0] ? '+' : ''}
                  ${(chartData[chartData.length - 1] - chartData[0]).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  headerLeft: {
    flex: 1,
  },
  symbol: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 12,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 14,
  },
  chartContainer: {
    flex: 1,
  },
  chartContent: {
    padding: 16,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
