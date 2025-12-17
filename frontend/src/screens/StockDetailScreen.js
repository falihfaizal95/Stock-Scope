import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI, newsAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;

export default function StockDetailScreen() {
  const route = useRoute();
  const { symbol } = route.params;
  const [stock, setStock] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, watchlist } = useWatchlist();
  const theme = useTheme();

  const inWatchlist = isInWatchlist(symbol);

  useEffect(() => {
    fetchStockDetails();
  }, [symbol]);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      const [stockData, newsData] = await Promise.all([
        stockAPI.getStockDetails(symbol),
        newsAPI.getStockNews(symbol),
      ]);
      setStock(stockData);
      setNews(newsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching stock details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (inWatchlist) {
      const watchlistItem = watchlist.find((item) => item.symbol === symbol);
      if (watchlistItem) {
        await removeFromWatchlist(watchlistItem.id);
      }
    } else {
      await addToWatchlist(symbol, stock.name);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>
          Loading stock details...
        </Text>
      </View>
    );
  }

  if (!stock) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Stock not found
        </Text>
      </View>
    );
  }

  const isPositive = stock.changePercent >= 0;

  // Generate chart data
  const generateChartData = () => {
    const data = [];
    const baseValue = stock.price || 150;
    for (let i = 0; i < 20; i++) {
      const change = isPositive 
        ? Math.random() * 10 
        : -Math.random() * 10;
      data.push(baseValue + change + (i * (isPositive ? 2 : -2)));
    }
    return data;
  };

  const chartData = generateChartData();
  const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.stockHeader}>
          <View>
            <Text style={[styles.symbol, { color: theme.colors.text }]}>
              {stock.symbol}
            </Text>
            <Text style={[styles.name, { color: theme.colors.placeholder }]}>
              {stock.name}
            </Text>
          </View>
          <View style={styles.priceContainer}>
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

        <Button
          mode={inWatchlist ? 'outlined' : 'contained'}
          onPress={handleWatchlistToggle}
          style={styles.watchlistButton}
          buttonColor={inWatchlist ? 'transparent' : theme.colors.primary}
          textColor={inWatchlist ? theme.colors.primary : '#000'}
          labelStyle={{ fontSize: 16, fontWeight: '600' }}
        >
          {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
      </View>

      {/* Large Chart */}
      <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          1 Day Chart
        </Text>
        <LineChart
          data={{
            labels: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            datasets: [
              {
                data: chartData,
                color: () => chartColor,
                strokeWidth: 3,
              },
            ],
          }}
          width={screenWidth - 32}
          height={220}
          withDots={false}
          withShadow={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withInnerLines={false}
          withOuterLines={false}
          chartConfig={{
            backgroundColor: 'transparent',
            backgroundGradientFrom: 'transparent',
            backgroundGradientTo: 'transparent',
            decimalPlaces: 0,
            color: () => chartColor,
            labelColor: () => theme.colors.placeholder,
            style: {
              borderRadius: 0,
            },
            propsForBackgroundLines: {
              strokeWidth: 0.5,
              stroke: theme.colors.border,
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

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Key Statistics
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
              Market Cap
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stock.marketCap || 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
              Volume
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stock.volume || 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
              52W High
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              ${stock.week52High?.toFixed(2) || 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>
              52W Low
            </Text>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              ${stock.week52Low?.toFixed(2) || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {news.length > 0 && (
        <View style={styles.newsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Latest News
          </Text>
          {news.map((article, index) => (
            <View key={index} style={[styles.newsCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.newsTitle, { color: theme.colors.text }]}>
                {article.title}
              </Text>
              <View style={styles.newsMeta}>
                <Text style={[styles.newsSource, { color: theme.colors.primary }]}>
                  {article.source}
                </Text>
                <Text style={[styles.newsDate, { color: theme.colors.placeholder }]}>
                  {new Date(article.publishedAt).toLocaleDateString()}
                </Text>
              </View>
              {article.description && (
                <Text style={[styles.newsDescription, { color: theme.colors.placeholder }]}>
                  {article.description}
                </Text>
              )}
            </View>
          ))}
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
  errorText: {
    fontSize: 18,
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  symbol: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
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
  watchlistButton: {
    marginTop: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  newsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  newsCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 14,
    fontWeight: '600',
  },
  newsDate: {
    fontSize: 14,
  },
  newsDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
