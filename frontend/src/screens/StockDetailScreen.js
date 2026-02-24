import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Button,
  TextInput,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI, newsAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useTheme } from 'react-native-paper';
import ExpandedChart from '../components/ExpandedChart';
import { usePortfolio } from '../context/PortfolioContext';

const screenWidth = Dimensions.get('window').width;

export default function StockDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol } = route.params;
  const [stock, setStock] = useState(null);
  const [news, setNews] = useState([]);
  const [relatedStocks, setRelatedStocks] = useState([]);
  const [earningsReports, setEarningsReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [chartExpanded, setChartExpanded] = useState(false);
  const [tradeVisible, setTradeVisible] = useState(false);
  const [tradeAction, setTradeAction] = useState('buy');
  const [tradeShares, setTradeShares] = useState('');
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeSuccessMessage, setTradeSuccessMessage] = useState('');
  const [selectedChartRange, setSelectedChartRange] = useState('1D');
  const [selectedEarningsReport, setSelectedEarningsReport] = useState(null);
  const [hoveredChartIndex, setHoveredChartIndex] = useState(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, watchlist } = useWatchlist();
  const { portfolio, buyStock, sellStock } = usePortfolio();
  const theme = useTheme();

  const inWatchlist = isInWatchlist(symbol);

  useEffect(() => {
    fetchStockDetails();
  }, [symbol]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: symbol,
      headerStyle: { backgroundColor: '#1c1c1e' },
      headerTintColor: '#ffffff',
      headerTitleStyle: { fontWeight: '700' },
    });
  }, [navigation, symbol]);

  useEffect(() => {
    setHoveredChartIndex(null);
  }, [symbol, selectedChartRange]);

  const fetchStockDetails = async () => {
    setLoading(true);
    setStock(null);
    setErrorMessage('');
    try {
      const stockData = await stockAPI.getStockDetails(symbol);
      if (stockData && stockData.error) {
        console.error('Stock API error:', stockData.error);
        setStock(null);
      } else if (stockData && stockData.price !== undefined) {
        setStock(stockData);
        // Fetch news separately to not block on error
        try {
          const [newsData, relatedData, earningsData] = await Promise.all([
            newsAPI.getStockNews(symbol).catch(() => []),
            stockAPI.getRelatedStocks(symbol).catch(() => []),
            stockAPI.getStockEarnings(symbol).catch(() => []),
          ]);
          setNews((newsData || []).slice(0, 5));
          setRelatedStocks((relatedData || []).filter((item) => item?.symbol && item.symbol !== symbol).slice(0, 8));
          setEarningsReports((earningsData || []).slice(0, 6));
        } catch (extraError) {
          console.error('Stock extras error:', extraError);
          setNews([]);
          setRelatedStocks([]);
          setEarningsReports([]);
        }
      } else {
        console.error('Invalid stock data:', stockData);
        setStock(null);
        setErrorMessage('Stock data is unavailable');
      }
    } catch (error) {
      console.error('Error fetching stock details:', error);
      setStock(null);
      setErrorMessage(error.message || 'Failed to load stock details');
      setRelatedStocks([]);
      setEarningsReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (inWatchlist) {
      const watchlistItem = watchlist.find((item) => item.symbol === symbol);
      if (watchlistItem) {
        const result = await removeFromWatchlist(watchlistItem.id);
        if (!result?.success) {
          alert(result?.error || 'Failed to remove from watchlist');
        }
      }
    } else {
      const result = await addToWatchlist(symbol, stock.name, {
        addedPrice: typeof stock.price === 'number' ? stock.price : null,
        logo: stock.logo || null,
      });
      if (!result?.success) {
        alert(result?.error || 'Failed to add to watchlist');
      }
    }
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return String(value.toFixed(2));
  };

  const formatPercent = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const currentHolding = portfolio?.holdings?.find((h) => h.symbol === symbol);
  const ownedShares = currentHolding?.shares || 0;

  const openTradeModal = () => {
    setTradeAction(ownedShares > 0 ? 'sell' : 'buy');
    setTradeShares('');
    setTradeVisible(true);
  };

  const submitTrade = async () => {
    const shares = Number(tradeShares);
    if (!stock?.price || !shares || shares <= 0) {
      alert('Enter a valid number of shares');
      return;
    }
    setTradeSubmitting(true);
    try {
      const result = tradeAction === 'buy'
        ? await buyStock(symbol, shares, stock.price)
        : await sellStock(symbol, shares, stock.price);

      if (!result?.success) {
        alert(result?.error || `Failed to ${tradeAction} stock`);
        return;
      }

      setTradeVisible(false);
      setTradeSuccessMessage(`You have ${tradeAction === 'buy' ? 'bought' : 'sold'} ${shares} share${shares > 1 ? 's' : ''} of ${symbol}`);
      setTimeout(() => setTradeSuccessMessage(''), 1600);
    } finally {
      setTradeSubmitting(false);
      setTradeShares('');
    }
  };

  const safePrice = stock?.price || 150;
  const safeChangePercent = stock?.changePercent ?? 0;
  const isPositive = safeChangePercent >= 0;

  // Generate mock chart data per selected timeframe (placeholder until historical candles API is wired)
  const generateChartData = (range) => {
    const data = [];
    const baseValue = safePrice;
    const pointsByRange = { '1D': 24, '1W': 20, '1M': 28, '3M': 36, 'YTD': 42, '1Y': 52, '5Y': 60, 'MAX': 72 };
    const driftByRange = { '1D': 0.2, '1W': 0.35, '1M': 0.45, '3M': 0.6, 'YTD': 0.7, '1Y': 0.8, '5Y': 1.0, 'MAX': 1.15 };
    const points = pointsByRange[range] || 24;
    const drift = driftByRange[range] || 0.4;
    const seedSource = `${symbol}-${range}`;
    let seed = 0;
    for (let s = 0; s < seedSource.length; s++) {
      seed = (seed * 31 + seedSource.charCodeAt(s)) % 100000;
    }

    for (let i = 0; i < points; i++) {
      const amplitude = 4 + (points / 20);
      const wave1 = Math.sin((i + seed / 97) * 0.65) * (amplitude * 0.9);
      const wave2 = Math.cos((i + seed / 53) * 1.15) * (amplitude * 0.45);
      const micro = Math.sin((i + seed / 17) * 2.2) * (amplitude * 0.18);
      const change = isPositive ? (wave1 + wave2 + micro) : -(wave1 + wave2 + micro);
      const trend = i * (isPositive ? drift : -drift);
      data.push(baseValue + change + trend);
    }
    return data;
  };

  const generateChartTimestamps = (range, points) => {
    const now = Date.now();
    const intervals = {
      '1D': 60 * 60 * 1000,
      '1W': 8 * 60 * 60 * 1000,
      '1M': 24 * 60 * 60 * 1000,
      '3M': 3 * 24 * 60 * 60 * 1000,
      'YTD': 7 * 24 * 60 * 60 * 1000,
      '1Y': 7 * 24 * 60 * 60 * 1000,
      '5Y': 30 * 24 * 60 * 60 * 1000,
      'MAX': 45 * 24 * 60 * 60 * 1000,
    };
    const step = intervals[range] || intervals['1D'];
    return Array.from({ length: points }, (_, i) => new Date(now - step * (points - 1 - i)));
  };

  const chartData = generateChartData(selectedChartRange);
  const chartTimestamps = generateChartTimestamps(selectedChartRange, chartData.length);
  const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;
  const chartRanges = ['1D', '1W', '1M', '3M', 'YTD', '1Y', '5Y', 'MAX'];
  const chartInnerWidth = screenWidth - 64;
  const chartDisplayIndex = hoveredChartIndex ?? (chartData.length - 1);
  const chartDisplayPrice = chartData[chartDisplayIndex];
  const chartDisplayTime = chartTimestamps[chartDisplayIndex];
  const hoverX = chartData.length > 1 ? (chartDisplayIndex / (chartData.length - 1)) * chartInnerWidth : 0;
  const minChart = Math.min(...chartData);
  const maxChart = Math.max(...chartData);
  const chartHeight = 260;
  const hoverY =
    maxChart === minChart
      ? chartHeight / 2
      : chartHeight - ((chartDisplayPrice - minChart) / (maxChart - minChart)) * (chartHeight - 12);

  const formatChartHoverTime = (date, range) => {
    if (!date) return '';
    const d = new Date(date);
    if (range === '1D') {
      return d.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
    if (range === '1W' || range === '1M') {
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const aboutSummary = stock?.industry
    ? `${stock.name} operates in the ${stock.industry} industry and trades on ${stock.exchange || 'its primary exchange'}.`
    : `${stock?.name || symbol} trades on ${stock?.exchange || 'its primary exchange'}.`;

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
          {errorMessage || 'Stock not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.stockHeader}>
          <View style={styles.stockHeaderLeft}>
            <Text style={[styles.symbol, { color: theme.colors.placeholder }]}>
              {stock.symbol}
            </Text>
            <Text style={[styles.nameLarge, { color: theme.colors.text }]}>
              {stock.name}
            </Text>
            <Text style={[styles.priceUnderName, { color: theme.colors.text }]}>
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
          <View style={styles.actionButtonsColumn}>
            <Button
              mode="contained"
              onPress={handleWatchlistToggle}
              style={[
                styles.watchlistButton,
                {
                  backgroundColor: inWatchlist ? '#1f5f3a' : theme.colors.primary,
                  borderColor: inWatchlist ? '#2a7a4b' : 'transparent',
                },
              ]}
              buttonColor={inWatchlist ? '#1f5f3a' : theme.colors.primary}
              textColor={inWatchlist ? '#d8ffe7' : '#000'}
              icon={inWatchlist ? 'check' : 'bookmark-plus-outline'}
              labelStyle={{ fontSize: 13, fontWeight: '700' }}
              contentStyle={{ paddingVertical: 2 }}
            >
              {inWatchlist ? 'Added' : 'Watchlist'}
            </Button>
            <Button
              mode="contained"
              onPress={openTradeModal}
              style={[styles.tradeButton, { backgroundColor: '#0a84ff' }]}
              buttonColor="#0a84ff"
              textColor="#fff"
              icon="swap-horizontal"
              labelStyle={{ fontSize: 13, fontWeight: '700' }}
            >
              Trade
            </Button>
          </View>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.appleChartTopMeta}>
          <View>
            <Text style={[styles.chartMetaLabel, { color: theme.colors.placeholder }]}>
              {selectedChartRange === '1D' ? '24 Hour Market' : `${selectedChartRange} Market`}
            </Text>
            <Text style={[styles.chartHoverPrice, { color: theme.colors.text }]}>
              ${Number(chartDisplayPrice || stock.price || 0).toFixed(2)}
            </Text>
            <Text style={[styles.chartHoverTime, { color: theme.colors.placeholder }]}>
              {formatChartHoverTime(chartDisplayTime, selectedChartRange)}
            </Text>
          </View>
          <Button
            mode="text"
            onPress={() => setChartExpanded(true)}
            textColor={theme.colors.primary}
            labelStyle={{ fontSize: 12, fontWeight: '700' }}
            compact
          >
            Expand
          </Button>
        </View>
        <View style={styles.chartWrapper}>
          <LineChart
            data={{
              labels: Array(chartData.length).fill(''),
              datasets: [
                {
                  data: chartData,
                  color: () => chartColor,
                  strokeWidth: 2.5,
                },
              ],
            }}
            width={chartInnerWidth}
            height={chartHeight}
            withDots={false}
            withShadow={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 2,
              color: () => chartColor,
              labelColor: () => 'transparent',
              strokeWidth: 2,
              barPercentage: 1,
              useShadowColorFromDataset: false,
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
            segments={0}
          />
          {Platform.OS === 'web' && (
            <View
              style={styles.chartHoverLayer}
              onMouseMove={(event) => {
                const x = event?.nativeEvent?.locationX ?? 0;
                const clampedX = Math.max(0, Math.min(chartInnerWidth, x));
                const idx = Math.round((clampedX / chartInnerWidth) * (chartData.length - 1));
                setHoveredChartIndex(Math.max(0, Math.min(chartData.length - 1, idx)));
              }}
              onMouseLeave={() => setHoveredChartIndex(null)}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.chartCrosshair,
                  { left: Math.max(0, Math.min(chartInnerWidth - 1, hoverX)) },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  styles.chartHoverDot,
                  {
                    left: Math.max(0, Math.min(chartInnerWidth - 10, hoverX - 5)),
                    top: Math.max(0, Math.min(chartHeight - 10, hoverY - 5)),
                    borderColor: theme.colors.background,
                    backgroundColor: chartColor,
                  },
                ]}
              />
            </View>
          )}
        </View>
        <View style={[styles.chartDottedDivider, { borderBottomColor: theme.colors.border }]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartRangeRow}>
          {chartRanges.map((range) => {
            const active = selectedChartRange === range;
            return (
              <TouchableOpacity
                key={range}
                onPress={() => setSelectedChartRange(range)}
                style={styles.chartRangeButton}
              >
                <Text
                  style={[
                    styles.chartRangeText,
                    { color: active ? theme.colors.primary : theme.colors.text },
                  ]}
                >
                  {range}
                </Text>
                {active && <View style={[styles.chartRangeUnderline, { backgroundColor: theme.colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Key Statistics
        </Text>
        <View style={styles.statsGrid}>
          {[
            ['Market Cap', formatNumber(stock.marketCap)],
            ['P/E Ratio', typeof stock.peRatio === 'number' ? stock.peRatio.toFixed(2) : 'N/A'],
            ['Dividend Yield', formatPercent(stock.dividendYield)],
            ['Avg Volume', formatNumber(stock.avgVolume)],
            ['Open Price', formatCurrency(stock.open)],
            ['High Today', formatCurrency(stock.high)],
            ['Low Today', formatCurrency(stock.low)],
            ['Volume', formatNumber(stock.volume)],
            ['52W High', formatCurrency(stock.week52High)],
            ['52W Low', formatCurrency(stock.week52Low)],
            ['Beta', typeof stock.beta === 'number' ? stock.beta.toFixed(2) : 'N/A'],
            ['EPS (TTM)', typeof stock.epsTTM === 'number' ? stock.epsTTM.toFixed(2) : 'N/A'],
          ].map(([label, value]) => (
            <View key={label} style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>{label}</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {relatedStocks.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            People who own {symbol} also own:
          </Text>
          <Text style={[styles.cardSubtitle, { color: theme.colors.placeholder }]}>
            Based on comparable/peer stocks from market data.
          </Text>
          <View style={styles.relatedWrap}>
            {relatedStocks.map((item) => (
              <TouchableOpacity
                key={item.symbol}
                style={[styles.relatedChip, { backgroundColor: theme.colors.background }]}
                onPress={() => navigation.navigate('StockDetail', { symbol: item.symbol })}
              >
                <Text style={[styles.relatedChipText, { color: theme.colors.text }]}>{item.symbol}</Text>
                {typeof item.changePercent === 'number' && (
                  <Text
                    style={[
                      styles.relatedChipPct,
                      { color: item.changePercent >= 0 ? theme.colors.positive : theme.colors.negative },
                    ]}
                  >
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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

      {earningsReports.length > 0 && (
        <View style={styles.newsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Earnings Reports
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.earningsCardsRow}>
          {earningsReports.map((report, index) => {
            const positiveSurprise = (report.surprisePercent || 0) >= 0;
            return (
              <TouchableOpacity
                key={`${report.period}-${index}`}
                onPress={() => setSelectedEarningsReport(report)}
                activeOpacity={0.85}
                style={[styles.earningsCardHorizontal, { backgroundColor: theme.colors.surface }]}
              >
                <Text style={[styles.newsTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {report.period || `Q${report.quarter || ''} ${report.year || ''}`}
                </Text>
                <View style={styles.earningsGrid}>
                  <Text style={[styles.earningsItem, { color: theme.colors.placeholder }]}>
                    Actual: <Text style={{ color: theme.colors.text }}>{report.actual ?? 'N/A'}</Text>
                  </Text>
                  <Text style={[styles.earningsItem, { color: theme.colors.placeholder }]}>
                    Estimate: <Text style={{ color: theme.colors.text }}>{report.estimate ?? 'N/A'}</Text>
                  </Text>
                  <Text style={[styles.earningsItem, { color: theme.colors.placeholder }]}>
                    Surprise: <Text style={{ color: theme.colors.text }}>{report.surprise ?? 'N/A'}</Text>
                  </Text>
                  <Text style={[styles.earningsItem, { color: theme.colors.placeholder }]}>
                    Surprise %:{' '}
                    <Text style={{ color: positiveSurprise ? theme.colors.positive : theme.colors.negative }}>
                      {typeof report.surprisePercent === 'number'
                        ? `${report.surprisePercent >= 0 ? '+' : ''}${report.surprisePercent.toFixed(2)}%`
                        : 'N/A'}
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>About</Text>
        <Text style={[styles.aboutSummary, { color: theme.colors.text }]}>{aboutSummary}</Text>
        <View style={styles.statsGrid}>
          {[
            ['Industry', stock.industry || 'N/A'],
            ['Exchange', stock.exchange || 'N/A'],
            ['Country', stock.country || 'N/A'],
            ['IPO Date', stock.ipo || 'N/A'],
            ['Currency', stock.currency || 'N/A'],
            ['Shares Outstanding', formatNumber(stock.shareOutstanding)],
          ].map(([label, value]) => (
            <View key={label} style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>{label}</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]} numberOfLines={2}>{value}</Text>
            </View>
          ))}
        </View>
        {stock.website ? (
          <Text style={[styles.websiteText, { color: theme.colors.primary }]}>{stock.website}</Text>
        ) : null}
      </View>

      <View style={styles.bottomPadding} />
      
      <ExpandedChart
        visible={chartExpanded}
        onClose={() => setChartExpanded(false)}
        symbol={symbol}
        stockData={stock}
      />

      <Modal visible={tradeVisible} animationType="slide" transparent={false} onRequestClose={() => setTradeVisible(false)}>
        <View style={styles.tradeModalRoot}>
          <View style={styles.tradeModalHeader}>
            <Text style={styles.tradeModalTitle}>Trade {symbol}</Text>
            <Button mode="text" onPress={() => setTradeVisible(false)} textColor="#111">Close</Button>
          </View>

          <View style={styles.tradeToggleRow}>
            <TouchableOpacity
              style={[styles.tradeToggleButton, tradeAction === 'buy' && styles.tradeToggleButtonActiveBuy]}
              onPress={() => setTradeAction('buy')}
            >
              <Text style={[styles.tradeToggleText, tradeAction === 'buy' && styles.tradeToggleTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tradeToggleButton, tradeAction === 'sell' && styles.tradeToggleButtonActiveSell]}
              onPress={() => setTradeAction('sell')}
            >
              <Text style={[styles.tradeToggleText, tradeAction === 'sell' && styles.tradeToggleTextActive]}>Sell</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tradeInfoCard}>
            <Text style={styles.tradeInfoLine}>Current Price: ${stock.price?.toFixed(2)}</Text>
            <Text style={styles.tradeInfoLine}>Cash Available: ${(portfolio?.cash || 0).toFixed(2)}</Text>
            <Text style={styles.tradeInfoLine}>Shares Owned: {ownedShares}</Text>
            <Text style={styles.tradeInfoLine}>
              {tradeAction === 'buy'
                ? `Max Buy: ${stock.price ? Math.floor((portfolio?.cash || 0) / stock.price) : 0} shares`
                : `Max Sell: ${ownedShares} shares`}
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Shares"
            value={tradeShares}
            onChangeText={setTradeShares}
            keyboardType="numeric"
            style={styles.tradeInput}
          />

          <Text style={styles.tradeTotalText}>
            Estimated {tradeAction === 'buy' ? 'Cost' : 'Proceeds'}:{' '}
            ${((Number(tradeShares) || 0) * (stock.price || 0)).toFixed(2)}
          </Text>

          <Button
            mode="contained"
            onPress={submitTrade}
            loading={tradeSubmitting}
            disabled={tradeSubmitting}
            buttonColor={tradeAction === 'buy' ? '#16a34a' : '#ef4444'}
            style={styles.tradeSubmitButton}
            textColor="#fff"
          >
            {tradeAction === 'buy' ? 'Buy Shares' : 'Sell Shares'}
          </Button>
        </View>
      </Modal>

      <Modal visible={!!tradeSuccessMessage} transparent={false} animationType="fade">
        <View style={styles.tradeSuccessRoot}>
          <Text style={styles.tradeSuccessText}>{tradeSuccessMessage}</Text>
        </View>
      </Modal>

      <Modal visible={!!selectedEarningsReport} animationType="slide" transparent={false} onRequestClose={() => setSelectedEarningsReport(null)}>
        <View style={styles.tradeModalRoot}>
          <View style={styles.tradeModalHeader}>
            <Text style={styles.tradeModalTitle}>Earnings Report</Text>
            <Button mode="text" onPress={() => setSelectedEarningsReport(null)} textColor="#111">Close</Button>
          </View>
          {selectedEarningsReport && (
            <View style={styles.tradeInfoCard}>
              <Text style={styles.tradeInfoLine}>Period: {selectedEarningsReport.period || 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>Quarter: {selectedEarningsReport.quarter || 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>Year: {selectedEarningsReport.year || 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>Actual EPS: {selectedEarningsReport.actual ?? 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>Estimated EPS: {selectedEarningsReport.estimate ?? 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>Surprise: {selectedEarningsReport.surprise ?? 'N/A'}</Text>
              <Text style={styles.tradeInfoLine}>
                Surprise %: {typeof selectedEarningsReport.surprisePercent === 'number'
                  ? `${selectedEarningsReport.surprisePercent >= 0 ? '+' : ''}${selectedEarningsReport.surprisePercent.toFixed(2)}%`
                  : 'N/A'}
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
  stockHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
  },
  chartWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  appleChartTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartMetaLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartHoverPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  chartHoverTime: {
    fontSize: 12,
    marginTop: 2,
  },
  chartDottedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginTop: 2,
    marginBottom: 6,
  },
  chartRangeRow: {
    paddingTop: 2,
    paddingRight: 8,
  },
  chartRangeButton: {
    marginRight: 18,
    paddingVertical: 6,
    alignItems: 'center',
  },
  chartRangeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  chartRangeUnderline: {
    marginTop: 6,
    width: 22,
    height: 3,
    borderRadius: 3,
  },
  chartHoverLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  chartCrosshair: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chartHoverDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  expandButton: {
    borderRadius: 8,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  symbol: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 16,
  },
  nameLarge: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 8,
  },
  priceUnderName: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
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
    borderRadius: 12,
    borderWidth: 1,
    transition: 'background-color 220ms ease, transform 180ms ease, border-color 220ms ease',
    marginBottom: 10,
  },
  actionButtonsColumn: {
    width: 146,
    alignItems: 'stretch',
  },
  tradeButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,132,255,0.35)',
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
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 12,
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
  relatedWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  relatedChip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    margin: 4,
    minWidth: 110,
  },
  relatedChipText: {
    fontSize: 18,
    fontWeight: '700',
  },
  relatedChipPct: {
    fontSize: 14,
    marginTop: 4,
  },
  earningsGrid: {
    marginTop: 4,
  },
  earningsItem: {
    fontSize: 13,
    marginBottom: 6,
  },
  earningsCardsRow: {
    paddingRight: 10,
  },
  earningsCardHorizontal: {
    width: 260,
    marginRight: 12,
    borderRadius: 14,
    padding: 14,
  },
  aboutSummary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  websiteText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  tradeModalRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  tradeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  tradeModalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111111',
  },
  tradeToggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  tradeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tradeToggleButtonActiveBuy: {
    backgroundColor: '#dcfce7',
  },
  tradeToggleButtonActiveSell: {
    backgroundColor: '#fee2e2',
  },
  tradeToggleText: {
    color: '#334155',
    fontWeight: '700',
  },
  tradeToggleTextActive: {
    color: '#111827',
  },
  tradeInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  tradeInfoLine: {
    color: '#0f172a',
    fontSize: 14,
    marginBottom: 6,
  },
  tradeInput: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  tradeTotalText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  tradeSubmitButton: {
    borderRadius: 12,
  },
  tradeSuccessRoot: {
    flex: 1,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tradeSuccessText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  bottomPadding: {
    height: 20,
  },
});
