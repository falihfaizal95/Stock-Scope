import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { stockAPI } from '../utils/api';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

// Search Result Item Component
const SearchResultItem = React.memo(({ item, index, theme, handleStockPress, generateChartData }) => {
  const isPositive = item.changePercent >= 0;
  const chartData = useMemo(() => generateChartData(isPositive), [isPositive, generateChartData]);
  const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;
  const itemAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = itemAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const opacity = itemAnim;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }],
      }}
    >
      <TouchableOpacity 
        onPress={() => handleStockPress(item.symbol)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.stockCard,
          {
            backgroundColor: theme.colors.surface,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              },
              android: {
                elevation: 3,
              },
            }),
          },
        ]}>
          <View style={styles.stockRow}>
            <View style={styles.stockInfo}>
              <Text style={[styles.stockSymbol, { color: theme.colors.text }]}>
                {item.symbol}
              </Text>
              <Text style={[styles.stockName, { color: theme.colors.placeholder }]} numberOfLines={1}>
                {item.name}
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
    </Animated.View>
  );
});

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchBarRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setResults([]);
        fadeAnim.setValue(0);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (results.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [results]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const data = await stockAPI.searchStocks(searchQuery);
      setResults(data);
      if (Platform.OS !== 'web' && data.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStockPress = useCallback((symbol) => {
    Keyboard.dismiss();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('StockDetail', { symbol });
  }, [navigation]);

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

  const renderStockItem = useCallback(({ item, index }) => (
    <SearchResultItem
      item={item}
      index={index}
      theme={theme}
      handleStockPress={handleStockPress}
      generateChartData={generateChartData}
    />
  ), [theme, handleStockPress, generateChartData]);

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
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>
            Searching...
          </Text>
        </View>
      )}

      {!loading && searchQuery.trim().length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={[styles.placeholderText, { color: theme.colors.placeholder }]}>
            Start typing to search stocks
          </Text>
          <Text style={[styles.placeholderSubtext, { color: theme.colors.placeholder }]}>
            Search by ticker symbol or company name
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

      {!loading && results.length > 0 && (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={results}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.symbol}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={(data, index) => ({
              length: 88,
              offset: 88 * index,
              index,
            })}
          />
        </Animated.View>
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
  placeholderText: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 14,
  },
  noResultsText: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  stockCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
});
