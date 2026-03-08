import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { useWatchlist } from '../context/WatchlistContext';
import { stockAPI } from '../utils/api';

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function WatchlistScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  const { watchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const [priceMap, setPriceMap] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [brokenLogos, setBrokenLogos] = useState({});

  useEffect(() => {
    fetchCurrentPrices();
  }, [watchlist.length]);

  const fetchCurrentPrices = async () => {
    if (!watchlist.length) {
      setPriceMap({});
      setLoadingPrices(false);
      setRefreshing(false);
      return;
    }

    setLoadingPrices(true);
    try {
      const results = await Promise.allSettled(
        watchlist.map(async (item) => {
          const details = await stockAPI.getStockDetails(item.symbol);
          return [item.symbol, details];
        })
      );

      const nextMap = {};
      results.forEach((result, index) => {
        const symbol = watchlist[index]?.symbol;
        if (!symbol) return;
        if (result.status === 'fulfilled') {
          nextMap[symbol] = result.value[1];
        } else {
          nextMap[symbol] = null;
        }
      });

      setPriceMap(nextMap);
    } catch (error) {
      console.error('Watchlist price refresh error:', error);
    } finally {
      setLoadingPrices(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCurrentPrices();
  };

  const isLogoUsable = (symbol, logo) => Boolean(logo) && !brokenLogos[String(symbol || '').toUpperCase()];

  const getPerformance = (item) => {
    const current = priceMap[item.symbol];
    const currentPrice = current?.price;
    const addedPrice = typeof item.addedPrice === 'number' ? item.addedPrice : null;

    if (typeof currentPrice !== 'number' || typeof addedPrice !== 'number' || addedPrice <= 0) {
      return {
        currentPrice,
        addedPrice,
        dollarChange: null,
        percentChange: null,
      };
    }

    const dollarChange = currentPrice - addedPrice;
    const percentChange = (dollarChange / addedPrice) * 100;
    return { currentPrice, addedPrice, dollarChange, percentChange };
  };

  if (watchlistLoading && !watchlist.length) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Watchlist</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.placeholder }]}>
          Track added date, entry price, and live performance
        </Text>
      </View>

      {!watchlist.length ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No stocks in your watchlist</Text>
          <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
            Open any stock and tap "Add to Watchlist" to track it here.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {watchlist.map((item) => {
            const current = priceMap[item.symbol];
            const perf = getPerformance(item);
            const hasPerformance =
              typeof perf.dollarChange === 'number' && typeof perf.percentChange === 'number';
            const isPositive = (perf.dollarChange || 0) >= 0;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
                style={[styles.card, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.rowTop}>
                  <View style={styles.stockIdentity}>
                    {isLogoUsable(item.symbol, item.logo) ? (
                      <Image
                        source={{ uri: item.logo }}
                        style={styles.logo}
                        onError={() => setBrokenLogos((prev) => ({ ...prev, [String(item.symbol || '').toUpperCase()]: true }))}
                      />
                    ) : (
                      <View style={[styles.logo, styles.logoPlaceholder, { backgroundColor: theme.colors.border }]}>
                        <Text style={[styles.logoText, { color: theme.colors.placeholder }]}>
                          {item.symbol?.charAt(0) || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.nameWrap}>
                      <Text style={[styles.symbol, { color: theme.colors.text }]}>{item.symbol}</Text>
                      <Text style={[styles.name, { color: theme.colors.placeholder }]} numberOfLines={1}>
                        {item.name || item.symbol}
                      </Text>
                    </View>
                  </View>
                  <Button
                    mode="text"
                    compact
                    textColor={theme.colors.negative}
                    onPress={() => removeFromWatchlist(item.id)}
                    labelStyle={{ fontSize: 12, fontWeight: '700' }}
                  >
                    Remove
                  </Button>
                </View>

                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: theme.colors.placeholder }]}>
                    Added: <Text style={{ color: theme.colors.text }}>{formatDate(item.addedAt)}</Text>
                  </Text>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Added Price</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                      {formatCurrency(perf.addedPrice)}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Current Price</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                      {typeof perf.currentPrice === 'number'
                        ? formatCurrency(perf.currentPrice)
                        : (loadingPrices ? 'Loading...' : 'N/A')}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Gain/Loss ($)</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: hasPerformance ? (isPositive ? theme.colors.positive : theme.colors.negative) : theme.colors.text },
                      ]}
                    >
                      {hasPerformance
                        ? `${perf.dollarChange >= 0 ? '+' : ''}${perf.dollarChange.toFixed(2)}`
                        : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Gain/Loss (%)</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: hasPerformance ? (isPositive ? theme.colors.positive : theme.colors.negative) : theme.colors.text },
                      ]}
                    >
                      {hasPerformance ? formatPercent(perf.percentChange) : 'N/A'}
                    </Text>
                  </View>
                </View>

                {current?.stale && (
                  <Text style={[styles.staleText, { color: theme.colors.placeholder }]}>
                    Showing cached price due to temporary rate limit.
                  </Text>
                )}
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
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  nameWrap: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  staleText: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 24,
  },
});
