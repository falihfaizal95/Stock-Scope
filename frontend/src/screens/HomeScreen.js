import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from 'react-native-paper';
import StockScopeLogo from '../components/StockScopeLogo';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [marketData, setMarketData] = useState(null);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { watchlist } = useWatchlist();
  const { portfolio } = usePortfolio();
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch in parallel to reduce homepage load time.
      const [overviewResult, gainersResult, losersResult, cryptoResult] = await Promise.allSettled([
        stockAPI.getMarketOverview(),
        stockAPI.getTopGainers(),
        stockAPI.getTopLosers(),
        stockAPI.getCrypto(),
      ]);

      const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null;
      const gainers = gainersResult.status === 'fulfilled' ? (gainersResult.value || []) : [];
      const losers = losersResult.status === 'fulfilled' ? (losersResult.value || []) : [];
      const cryptoData = cryptoResult.status === 'fulfilled' ? (cryptoResult.value || []) : [];

      if (overviewResult.status === 'rejected') {
        console.error('Error fetching overview:', overviewResult.reason);
      }
      if (gainersResult.status === 'rejected') {
        console.error('Error fetching gainers:', gainersResult.reason);
      }
      if (losersResult.status === 'rejected') {
        console.error('Error fetching losers:', losersResult.reason);
      }
      if (cryptoResult.status === 'rejected') {
        console.error('Error fetching crypto:', cryptoResult.reason);
      }

      setMarketData(overview);
      
      // Combine S&P 500 and NASDAQ with gainers/losers
      const allStocks = [];
      
      // Add S&P 500 and NASDAQ as stock cards
      if (overview && overview.sp500 !== undefined) {
        allStocks.push({
          symbol: 'SPY',
          name: 'S&P 500',
          price: overview.sp500,
          changePercent: overview.sp500Change || 0,
          logo: null,
        });
        allStocks.push({
          symbol: 'QQQ',
          name: 'NASDAQ',
          price: overview.nasdaq,
          changePercent: overview.nasdaqChange || 0,
          logo: null,
        });
      }
      
      // Add top gainers (filter out invalid entries)
      if (Array.isArray(gainers)) {
        allStocks.push(...gainers.filter(s => s && s.symbol && s.price !== undefined).slice(0, 10));
      }
      
      // Add top losers (filter out invalid entries)
      if (Array.isArray(losers)) {
        allStocks.push(...losers.filter(s => s && s.symbol && s.price !== undefined).slice(0, 10));
      }
      
      // Sort all stocks by change percentage (gainers first)
      allStocks.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
      
      setTopGainers(allStocks.filter(s => s && s.changePercent >= 0));
      setTopLosers(allStocks.filter(s => s && s.changePercent < 0));
      setCrypto(Array.isArray(cryptoData) ? cryptoData : []);
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Set empty arrays on error so UI still renders
      setTopGainers([]);
      setTopLosers([]);
      setCrypto([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStockDetails = async (symbol) => {
    try {
      const details = await stockAPI.getStockDetails(symbol);
      return details;
    } catch (error) {
      console.error('Error fetching stock details:', error);
      return null;
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

  const renderStockCard = (stock, index) => {
    const isPositive = stock.changePercent >= 0;
    const chartData = generateChartData(isPositive);
    const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;
    const cardWidth = (screenWidth - 48) / 3; // 3 cards per row with padding

    return (
      <TouchableOpacity
        key={stock.symbol || index}
        onPress={() => navigation.navigate('StockDetail', { symbol: stock.symbol })}
        style={[styles.stockCard, { 
          backgroundColor: theme.colors.surface,
          width: cardWidth,
        }]}
        activeOpacity={0.7}
      >
        <View style={styles.stockCardContent}>
          <View style={styles.stockHeader}>
            {stock.logo ? (
              <Image 
                source={{ uri: stock.logo }} 
                style={styles.logo}
              />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                <Text style={[styles.logoText, { color: theme.colors.placeholder }]}>
                  {stock.symbol.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.stockInfo}>
            <Text style={[styles.stockSymbol, { color: theme.colors.text }]} numberOfLines={1}>
              {stock.symbol}
            </Text>
            <Text style={[styles.stockName, { color: theme.colors.placeholder }]} numberOfLines={2}>
              {stock.name || stock.symbol}
            </Text>
          </View>
          
          <View style={[styles.chartContainer, { width: cardWidth - 32, height: 50 }]}>
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
              width={cardWidth - 32}
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
                strokeWidth: 2,
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
                marginVertical: 0,
                borderRadius: 0,
                paddingRight: 0,
                paddingLeft: 0,
              }}
              fromZero={false}
            />
          </View>

          <View style={styles.stockPriceRow}>
            <Text style={[styles.price, { color: theme.colors.text }]}>
              ${stock.price?.toFixed(2)}
            </Text>
            <View style={[
              styles.changeBadge,
              { backgroundColor: isPositive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)' }
            ]}>
              <Text style={[
                styles.changeText,
                { color: isPositive ? theme.colors.positive : theme.colors.negative }
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
        <View style={styles.headerTop}>
          <StockScopeLogo size={40} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            StockScope
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {portfolio && (
        <View style={[styles.portfolioCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.portfolioTitle, { color: theme.colors.text }]}>
            Your Portfolio
          </Text>
          <View style={styles.portfolioRow}>
            <View>
              <Text style={[styles.portfolioLabel, { color: theme.colors.placeholder }]}>
                Cash
              </Text>
              <Text style={[styles.portfolioValue, { color: theme.colors.text }]}>
                ${portfolio.cash?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View>
              <Text style={[styles.portfolioLabel, { color: theme.colors.placeholder }]}>
                Holdings
              </Text>
              <Text style={[styles.portfolioValue, { color: theme.colors.text }]}>
                {portfolio.holdings?.length || 0}
              </Text>
            </View>
            <View>
              <Text style={[styles.portfolioLabel, { color: theme.colors.placeholder }]}>
                Total Value
              </Text>
              <Text style={[styles.portfolioValue, { color: theme.colors.primary }]}>
                ${portfolio.totalValue?.toFixed(2) || portfolio.cash?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {topGainers.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Gainers
          </Text>
          <View style={styles.stockGrid}>
            {topGainers.map((stock, index) => renderStockCard(stock, index))}
          </View>
        </View>
      )}

      {topLosers.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Losers
          </Text>
          <View style={styles.stockGrid}>
            {topLosers.map((stock, index) => renderStockCard(stock, index))}
          </View>
        </View>
      )}

      {crypto.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Cryptocurrency
          </Text>
          <View style={styles.stockGrid}>
            {crypto.map((coin, index) => renderStockCard(coin, index))}
          </View>
        </View>
      )}

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
                <View style={styles.stockCardContent}>
                  <View style={styles.stockHeader}>
                    <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                      <Text style={[styles.logoText, { color: theme.colors.placeholder }]}>
                        {item.symbol.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.stockInfo}>
                      <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
                        {item.symbol}
                      </Text>
                      <Text style={[styles.stockName, { color: theme.colors.placeholder }]}>
                        {item.name}
                      </Text>
                    </View>
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
                      width={screenWidth - 120}
                      height={60}
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

                  <View style={styles.stockPriceRow}>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginLeft: 12,
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
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stockCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 2,
  },
  stockCardContent: {
    width: '100%',
    alignItems: 'center',
  },
  stockHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
  },
  stockInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  stockName: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 4,
  },
  stockPriceRow: {
    width: '100%',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
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
  portfolioCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  portfolioTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  portfolioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  portfolioLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
