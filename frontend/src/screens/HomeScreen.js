import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [marketData, setMarketData] = useState(null);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { watchlist } = useWatchlist();
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overview, gainers, losers] = await Promise.all([
        stockAPI.getMarketOverview(),
        stockAPI.getTopGainers(),
        stockAPI.getTopLosers(),
      ]);
      setMarketData(overview);
      setTopGainers(gainers);
      setTopLosers(losers);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Generate mock chart data for demonstration
  const generateChartData = (isPositive) => {
    const data = [];
    const baseValue = 100;
    for (let i = 0; i < 10; i++) {
      const change = isPositive 
        ? Math.random() * 5 
        : -Math.random() * 5;
      data.push(baseValue + change + (i * (isPositive ? 1 : -1)));
    }
    return data;
  };

  const renderStockCard = (stock, isGainer = true) => {
    const chartData = generateChartData(isGainer);
    const chartColor = isGainer ? theme.colors.positive : theme.colors.negative;

    return (
      <TouchableOpacity
        key={stock.symbol}
        onPress={() => navigation.navigate('StockDetail', { symbol: stock.symbol })}
        style={[styles.stockCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={styles.stockRow}>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
              {stock.symbol}
            </Text>
            <Text style={[styles.stockName, { color: theme.colors.placeholder }]} numberOfLines={1}>
              {stock.name}
            </Text>
          </View>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: ['', '', '', '', '', '', '', '', '', ''],
                datasets: [
                  {
                    data: chartData,
                    color: () => chartColor,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth * 0.3}
              height={50}
              withDots={false}
              withShadow={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withInnerLines={false}
              withOuterLines={false}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: () => chartColor,
                labelColor: () => 'transparent',
                style: {
                  borderRadius: 0,
                },
                propsForBackgroundLines: {
                  strokeWidth: 0,
                },
                propsForDots: {
                  r: '0',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 0,
              }}
            />
          </View>

          <View style={styles.stockPrice}>
            <Text style={[styles.price, { color: theme.colors.text }]}>
              ${stock.price?.toFixed(2)}
            </Text>
            <View style={[
              styles.changeBadge,
              { backgroundColor: isGainer ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)' }
            ]}>
              <Text style={[
                styles.changeText,
                { color: isGainer ? theme.colors.positive : theme.colors.negative }
              ]}>
                {stock.changePercent >= 0 ? '+' : ''}
                {stock.changePercent?.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>
          Loading market data...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Stocks
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {marketData && (
        <View style={[styles.marketCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.marketRow}>
            <View style={styles.marketItem}>
              <Text style={[styles.marketLabel, { color: theme.colors.placeholder }]}>
                S&P 500
              </Text>
              <Text style={[styles.marketValue, { color: theme.colors.text }]}>
                {marketData.sp500?.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.marketChange,
                  {
                    color: marketData.sp500Change >= 0
                      ? theme.colors.positive
                      : theme.colors.negative,
                  },
                ]}
              >
                {marketData.sp500Change >= 0 ? '+' : ''}
                {marketData.sp500Change?.toFixed(2)}%
              </Text>
            </View>
            <View style={[styles.marketDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.marketItem}>
              <Text style={[styles.marketLabel, { color: theme.colors.placeholder }]}>
                NASDAQ
              </Text>
              <Text style={[styles.marketValue, { color: theme.colors.text }]}>
                {marketData.nasdaq?.toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.marketChange,
                  {
                    color: marketData.nasdaqChange >= 0
                      ? theme.colors.positive
                      : theme.colors.negative,
                  },
                ]}
              >
                {marketData.nasdaqChange >= 0 ? '+' : ''}
                {marketData.nasdaqChange?.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Top Gainers
        </Text>
        {topGainers.map((stock) => renderStockCard(stock, true))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Top Losers
        </Text>
        {topLosers.map((stock) => renderStockCard(stock, false))}
      </View>

      {watchlist.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Watchlist
          </Text>
          {watchlist.map((item) => {
            const chartData = generateChartData(Math.random() > 0.5);
            const isPositive = Math.random() > 0.5;
            const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;
            
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  navigation.navigate('StockDetail', { symbol: item.symbol })
                }
                style={[styles.stockCard, { backgroundColor: theme.colors.surface }]}
                activeOpacity={0.7}
              >
                <View style={styles.stockRow}>
                  <View style={styles.stockInfo}>
                    <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
                      {item.symbol}
                    </Text>
                    <Text style={[styles.stockName, { color: theme.colors.placeholder }]}>
                      {item.name}
                    </Text>
                  </View>
                  
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={{
                        labels: ['', '', '', '', '', '', '', '', '', ''],
                        datasets: [
                          {
                            data: chartData,
                            color: () => chartColor,
                            strokeWidth: 2,
                          },
                        ],
                      }}
                      width={screenWidth * 0.3}
                      height={50}
                      withDots={false}
                      withShadow={false}
                      withVerticalLines={false}
                      withHorizontalLines={false}
                      withInnerLines={false}
                      withOuterLines={false}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        decimalPlaces: 0,
                        color: () => chartColor,
                        labelColor: () => 'transparent',
                        style: {
                          borderRadius: 0,
                        },
                        propsForBackgroundLines: {
                          strokeWidth: 0,
                        },
                        propsForDots: {
                          r: '0',
                        },
                      }}
                      bezier
                      style={{
                        marginVertical: 8,
                        borderRadius: 0,
                      }}
                    />
                  </View>

                  <View style={styles.stockPrice}>
                    <Text style={[styles.price, { color: theme.colors.text }]}>
                      $150.25
                    </Text>
                    <View style={[
                      styles.changeBadge,
                      { backgroundColor: isPositive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)' }
                    ]}>
                      <Text style={[
                        styles.changeText,
                        { color: isPositive ? theme.colors.positive : theme.colors.negative }
                      ]}>
                        {isPositive ? '+' : ''}2.15%
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  marketCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  marketItem: {
    alignItems: 'center',
    flex: 1,
  },
  marketDivider: {
    width: 1,
  },
  marketLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  marketValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  marketChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  stockCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
  },
  chartContainer: {
    width: screenWidth * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockPrice: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
