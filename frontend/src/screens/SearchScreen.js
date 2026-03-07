import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI } from '../utils/api';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [cryptoMovers, setCryptoMovers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [initialDataError, setInitialDataError] = useState('');
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      fetchInitialData();
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300); // Reduced delay for faster results

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      const [gainers, losers, crypto] = await Promise.all([
        stockAPI.getTopGainers(),
        stockAPI.getTopLosers(),
        stockAPI.getCrypto(),
      ]);
      setTopGainers(gainers.slice(0, 5));
      setTopLosers(losers.slice(0, 5));
      setCryptoMovers((crypto || []).slice(0, 5));
      setInitialDataError('');
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setTopGainers([]);
      setTopLosers([]);
      setCryptoMovers([]);
      setInitialDataError('Unable to load market feed right now.');
    } finally {
      setLoadingData(false);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const data = await stockAPI.searchStocks(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockPress = (symbol) => {
    Keyboard.dismiss();
    navigation.navigate('StockDetail', { symbol });
  };

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

  const renderStockItem = ({ item }) => {
    const isPositive = item.changePercent >= 0;
    const chartData = generateChartData(isPositive);
    const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;

    return (
      <TouchableOpacity 
        onPress={() => handleStockPress(item.symbol)}
        activeOpacity={0.7}
      >
        <View style={[styles.stockCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.stockRow}>
            {item.logo ? (
              <Image 
                source={{ uri: item.logo }} 
                style={styles.logo}
              />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                <Text style={[styles.logoText, { color: theme.colors.placeholder }]}>
                  {item.symbol.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.stockInfo}>
              <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
                {item.symbol}
              </Text>
              <Text style={[styles.stockName, { color: theme.colors.placeholder }]} numberOfLines={1}>
                {item.name || item.symbol}
              </Text>
            </View>
            
            {item.price && (
              <>
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
                    width={screenWidth * 0.25}
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
                    ${item.price.toFixed(2)}
                  </Text>
                  <View style={[
                    styles.changeBadge,
                    { backgroundColor: isPositive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)' }
                  ]}>
                    <Text
                      style={[
                        styles.changeText,
                        {
                          color: isPositive
                            ? theme.colors.positive
                            : theme.colors.negative,
                        },
                      ]}
                    >
                      {item.changePercent >= 0 ? '+' : ''}
                      {item.changePercent?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStockCard = (stock, isGainer = true) => {
    const isPositive = stock.changePercent >= 0;
    const chartData = generateChartData(isPositive);
    const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;

    return (
      <TouchableOpacity
        key={stock.symbol}
        onPress={() => handleStockPress(stock.symbol)}
        style={[styles.stockCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.7}
      >
        <View style={styles.stockRow}>
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
          <View style={styles.stockInfo}>
            <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
              {stock.symbol}
            </Text>
            <Text style={[styles.stockName, { color: theme.colors.placeholder }]} numberOfLines={1}>
              {stock.name || stock.symbol}
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
              width={screenWidth * 0.25}
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

  const popularEtfs = [
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'IWM', name: 'Russell 2000 ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF' },
    { symbol: 'VTI', name: 'Total Market ETF' },
    { symbol: 'ARKK', name: 'Innovation ETF' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search stocks (e.g., AAPL, Tesla)"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[
            styles.searchbar,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
          inputStyle={{ color: theme.colors.text }}
          iconColor={theme.colors.placeholder}
          placeholderTextColor={theme.colors.placeholder}
        />
        {searchQuery.trim().length === 0 && (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: theme.colors.placeholder }]}>
              Start typing to search stocks
            </Text>
            <Text style={[styles.placeholderSubtext, { color: theme.colors.placeholder }]}>
              Search by ticker symbol or company name
            </Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>
            Searching...
          </Text>
        </View>
      )}

      {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={[styles.noResultsText, { color: theme.colors.placeholder }]}>
            No results found
          </Text>
          <Text style={[styles.noResultsSubtext, { color: theme.colors.placeholder }]}>
            Try a different search term
          </Text>
        </View>
      )}

      {!loading && searchQuery.trim().length > 0 && results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.symbol}
          contentContainerStyle={styles.listContent}
        />
      )}

      {!loading && searchQuery.trim().length === 0 && !loadingData && (
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {topGainers.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Gainers (24h)
              </Text>
              {topGainers.map((stock) => renderStockCard(stock, true))}
            </View>
          )}

          {topLosers.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Top Losers (24h)
              </Text>
              {topLosers.map((stock) => renderStockCard(stock, false))}
            </View>
          )}

          {cryptoMovers.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Crypto Movers (24h)
              </Text>
              {cryptoMovers.map((coin) => renderStockCard(coin, true))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Popular ETFs
            </Text>
            <View style={styles.etfGrid}>
              {popularEtfs.map((etf) => (
                <TouchableOpacity
                  key={etf.symbol}
                  style={[styles.etfChip, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleStockPress(etf.symbol)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.etfSymbol, { color: theme.colors.text }]}>{etf.symbol}</Text>
                  <Text style={[styles.etfName, { color: theme.colors.placeholder }]} numberOfLines={1}>
                    {etf.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {topGainers.length === 0 && topLosers.length === 0 && cryptoMovers.length === 0 && (
            <View style={styles.centerContainer}>
              <Text style={[styles.noResultsText, { color: theme.colors.text }]}>
                Market feed unavailable
              </Text>
              <Text style={[styles.noResultsSubtext, { color: theme.colors.placeholder }]}>
                {initialDataError || 'Pull to refresh and try again.'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {!loading && searchQuery.trim().length === 0 && loadingData && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 0,
  },
  placeholderContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noResultsText: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
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
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
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
    width: screenWidth * 0.25,
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
  etfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  etfChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 170,
  },
  etfSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  etfName: {
    fontSize: 12,
  },
});
