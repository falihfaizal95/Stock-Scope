import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { stockAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

// Skeleton Loader Component
const SkeletonCard = React.memo(({ theme }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.stockCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.stockRow}>
        <View style={styles.stockInfo}>
          <Animated.View
            style={[
              styles.skeletonBox,
              { backgroundColor: theme.colors.border, opacity },
              { width: 80, height: 20, marginBottom: 8 },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBox,
              { backgroundColor: theme.colors.border, opacity },
              { width: 120, height: 16 },
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.skeletonBox,
            { backgroundColor: theme.colors.border, opacity },
            { width: 100, height: 50 },
          ]}
        />
        <View style={styles.stockPrice}>
          <Animated.View
            style={[
              styles.skeletonBox,
              { backgroundColor: theme.colors.border, opacity },
              { width: 70, height: 20, marginBottom: 8 },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonBox,
              { backgroundColor: theme.colors.border, opacity },
              { width: 60, height: 16 },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const [marketData, setMarketData] = useState(null);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { watchlist } = useWatchlist();
  const theme = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

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

  const onRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await fetchData();
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

// Stock Card Component with animations
const StockCard = React.memo(({ stock, isGainer, index, theme, navigation, generateChartData }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const chartData = useMemo(() => generateChartData(isGainer), [isGainer]);
  const chartColor = isGainer ? theme.colors.positive : theme.colors.negative;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('StockDetail', { symbol: stock.symbol });
  };

  const scale = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const opacity = cardAnim;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={[
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
        ]}
        activeOpacity={0.8}
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
      </Animated.View>
    );
  });

  const renderStockCard = (stock, isGainer = true, index = 0) => (
    <StockCard
      key={stock.symbol}
      stock={stock}
      isGainer={isGainer}
      index={index}
      theme={theme}
      navigation={navigation}
      generateChartData={generateChartData}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Gainers
          </Text>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} theme={theme} />
          ))}
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Losers
          </Text>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} theme={theme} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
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
          <Animated.View
            style={[
              styles.marketCard,
              {
                backgroundColor: theme.colors.surface,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                  },
                  android: {
                    elevation: 4,
                  },
                }),
              },
            ]}
          >
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
          </Animated.View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Gainers
          </Text>
          {topGainers.map((stock, index) => renderStockCard(stock, true, index))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Losers
          </Text>
          {topLosers.map((stock, index) => renderStockCard(stock, false, index))}
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
      </Animated.View>
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
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonBox: {
    borderRadius: 8,
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
