import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Text, ActivityIndicator, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { stockAPI } from '../utils/api';
import { useWatchlist } from '../context/WatchlistContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useTheme } from 'react-native-paper';
import StockScopeLogo from '../components/StockScopeLogo';
import { useAuth } from '../context/AuthContext';

const RANGE_SECONDS = {
  LIVE: 24 * 60 * 60,
  '1D': 24 * 60 * 60,
  '1W': 7 * 24 * 60 * 60,
  '1M': 30 * 24 * 60 * 60,
  '3M': 90 * 24 * 60 * 60,
  '1Y': 365 * 24 * 60 * 60,
  ALL: 5 * 365 * 24 * 60 * 60,
};

const PORTFOLIO_RANGE_CONFIG = {
  LIVE: { resolution: '15', points: 24 },
  '1D': { resolution: '15', points: 28 },
  '1W': { resolution: '60', points: 36 },
  '1M': { resolution: 'D', points: 42 },
  '3M': { resolution: 'D', points: 48 },
  YTD: { resolution: 'D', points: 56 },
  '1Y': { resolution: 'W', points: 64 },
  ALL: { resolution: 'M', points: 60 },
};

const getRangeStart = (range, nowSec) => {
  if (range === 'YTD') {
    const now = new Date(nowSec * 1000);
    return Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000);
  }
  return nowSec - (RANGE_SECONDS[range] || RANGE_SECONDS['1D']);
};

const normalizeSeriesToLength = (values, targetLength, fallbackValue) => {
  if (targetLength <= 0) return [];
  const safeFallback = Number(fallbackValue || 0);
  if (!Array.isArray(values) || values.length === 0) {
    return Array.from({ length: targetLength }, () => safeFallback);
  }
  if (values.length === targetLength) {
    return values.map((v) => Number(v ?? safeFallback));
  }
  return Array.from({ length: targetLength }, (_, index) => {
    const sourceIndex = Math.round((index / Math.max(targetLength - 1, 1)) * (values.length - 1));
    const value = values[sourceIndex];
    return Number(value ?? safeFallback);
  });
};

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [marketData, setMarketData] = useState(null);
  const [topGainers, setTopGainers] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [crypto, setCrypto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPortfolioRange, setSelectedPortfolioRange] = useState('1D');
  const [portfolioChartData, setPortfolioChartData] = useState([0]);
  const [portfolioSeriesLoading, setPortfolioSeriesLoading] = useState(false);
  const [liveIndicatorOn, setLiveIndicatorOn] = useState(true);
  const [liveRefreshTick, setLiveRefreshTick] = useState(0);
  const [hoveredPortfolioIndex, setHoveredPortfolioIndex] = useState(null);
  const [brokenLogos, setBrokenLogos] = useState({});
  const navigation = useNavigation();
  const { watchlist } = useWatchlist();
  const { portfolio, refreshPortfolioValuation } = usePortfolio();
  const { userProfile } = useAuth();
  const theme = useTheme();
  const portfolioTotal = portfolio?.totalValue ?? portfolio?.cash ?? 0;
  const buyingPower = portfolio?.cash ?? 0;
  const positionCount = portfolio?.holdings?.length ?? 0;
  const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
  const portfolioRanges = ['LIVE', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'];
  const gridGap = 12;
  const gridColumns = windowWidth >= 1700 ? 4 : windowWidth >= 1200 ? 3 : windowWidth >= 760 ? 2 : 1;
  const cardWidth = (windowWidth - 32 - (gridColumns - 1) * gridGap) / gridColumns;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      refreshPortfolioValuation();

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
        allStocks.push(...gainers.filter(s => s && s.symbol && s.price !== undefined).slice(0, 24));
      }
      
      // Add top losers (filter out invalid entries)
      if (Array.isArray(losers)) {
        allStocks.push(...losers.filter(s => s && s.symbol && s.price !== undefined).slice(0, 16));
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
    setLiveRefreshTick((tick) => tick + 1);
  };

  useEffect(() => {
    if (selectedPortfolioRange !== 'LIVE') {
      setLiveIndicatorOn(false);
      return;
    }

    setLiveIndicatorOn(true);
    const blinkInterval = setInterval(() => {
      setLiveIndicatorOn((prev) => !prev);
    }, 550);
    const refreshInterval = setInterval(() => {
      setLiveRefreshTick((tick) => tick + 1);
    }, 20000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(refreshInterval);
    };
  }, [selectedPortfolioRange]);

  useEffect(() => {
    setHoveredPortfolioIndex(null);
  }, [selectedPortfolioRange, portfolioChartData.length]);

  useEffect(() => {
    const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
    const config = PORTFOLIO_RANGE_CONFIG[selectedPortfolioRange] || PORTFOLIO_RANGE_CONFIG['1D'];
    const targetPoints = config.points;
    let canceled = false;

    const buildPortfolioSeries = async () => {
      const cashValue = Number((portfolio?.cash ?? 0).toFixed(2));
      if (!holdings.length) {
        const flatSeries = Array.from({ length: targetPoints }, () => cashValue);
        if (!canceled) {
          setPortfolioChartData(flatSeries);
        }
        return;
      }

      setPortfolioSeriesLoading(true);
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        const from = getRangeStart(selectedPortfolioRange, nowSec);
        const to = nowSec;

        const seriesByHolding = await Promise.all(
          holdings.map(async (holding) => {
            const [candles, details] = await Promise.all([
              stockAPI.getStockCandles(holding.symbol, {
                resolution: config.resolution,
                from,
                to,
              }),
              stockAPI.getStockDetails(holding.symbol).catch(() => null),
            ]);
            return { holding, candles, livePrice: Number(details?.price) };
          })
        );

        const totalSeries = Array.from({ length: targetPoints }, () => cashValue);
        seriesByHolding.forEach(({ holding, candles, livePrice }) => {
          const hasLivePrice = Number.isFinite(livePrice) && livePrice > 0;
          const fallbackPrice = hasLivePrice ? livePrice : Number(holding.avgPrice || 0);
          const closes = candles?.s === 'ok' && Array.isArray(candles?.c) ? candles.c : [];
          const normalizedCloses = normalizeSeriesToLength(closes, targetPoints, fallbackPrice).map((price) =>
            Number(price || fallbackPrice)
          );
          if (hasLivePrice && normalizedCloses.length > 0) {
            normalizedCloses[normalizedCloses.length - 1] = livePrice;
          }

          normalizedCloses.forEach((price, index) => {
            totalSeries[index] += Number(holding.shares || 0) * price;
          });
        });

        const roundedSeries = totalSeries.map((value) => Number(value.toFixed(2)));
        if (!canceled) {
          setPortfolioChartData(roundedSeries);
        }
      } catch (error) {
        console.error('Error building portfolio chart data:', error);
        if (!canceled) {
          const fallbackTotal = Number((portfolioTotal || cashValue).toFixed(2));
          setPortfolioChartData(Array.from({ length: targetPoints }, () => fallbackTotal));
        }
      } finally {
        if (!canceled) {
          setPortfolioSeriesLoading(false);
        }
      }
    };

    buildPortfolioSeries();
    return () => {
      canceled = true;
    };
  }, [selectedPortfolioRange, portfolio?.cash, portfolio?.holdings, portfolioTotal, liveRefreshTick]);

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

  const isLogoUsable = (symbol, logo) => Boolean(logo) && !brokenLogos[String(symbol || '').toUpperCase()];

  const renderStockCard = (stock, index) => {
    const isPositive = stock.changePercent >= 0;
    const chartData = generateChartData(isPositive);
    const chartColor = isPositive ? theme.colors.positive : theme.colors.negative;
    const isEndOfRow = (index + 1) % gridColumns === 0;

    return (
      <TouchableOpacity
        key={stock.symbol || index}
        onPress={() => navigation.navigate('StockDetail', { symbol: stock.symbol })}
        style={[styles.stockCard, { 
          backgroundColor: theme.colors.surface,
          width: cardWidth,
          marginRight: isEndOfRow ? 0 : gridGap,
        }]}
        activeOpacity={0.7}
      >
        <View style={styles.stockCardContent}>
          <View style={styles.stockHeader}>
            {isLogoUsable(stock.symbol, stock.logo) ? (
              <Image 
                source={{ uri: stock.logo }} 
                style={styles.logo}
                onError={() => setBrokenLogos((prev) => ({ ...prev, [String(stock.symbol || '').toUpperCase()]: true }))}
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

  const portfolioDisplayTotal = portfolioChartData[portfolioChartData.length - 1] ?? portfolioTotal;
  const portfolioChartWidth = windowWidth - 72;
  const portfolioChartHeight = 180;
  const chartPointCount = portfolioChartData.length;
  const nowMs = Date.now();
  const fromMs = getRangeStart(selectedPortfolioRange, Math.floor(nowMs / 1000)) * 1000;
  const portfolioTimestamps = Array.from({ length: chartPointCount }, (_, index) => {
    if (chartPointCount <= 1) return new Date(nowMs);
    const progress = index / (chartPointCount - 1);
    return new Date(fromMs + (nowMs - fromMs) * progress);
  });
  const portfolioDisplayIndex = hoveredPortfolioIndex ?? Math.max(chartPointCount - 1, 0);
  const portfolioDisplayPrice = portfolioChartData[portfolioDisplayIndex] ?? portfolioDisplayTotal;
  const portfolioDisplayTime = portfolioTimestamps[portfolioDisplayIndex] ?? new Date();
  const portfolioStart = portfolioChartData[0] || portfolioDisplayTotal || 0;
  const portfolioChange = portfolioDisplayTotal - portfolioStart;
  const portfolioChangePct = portfolioStart > 0 ? (portfolioChange / portfolioStart) * 100 : 0;
  const portfolioPositive = portfolioChange >= 0;
  const changePeriodLabel = selectedPortfolioRange === 'LIVE' || selectedPortfolioRange === '1D'
    ? 'Today'
    : selectedPortfolioRange;
  const portfolioMin = Math.min(...portfolioChartData);
  const portfolioMax = Math.max(...portfolioChartData);
  const portfolioHoverX =
    chartPointCount > 1 ? (portfolioDisplayIndex / (chartPointCount - 1)) * portfolioChartWidth : 0;
  const portfolioHoverY =
    portfolioMax === portfolioMin
      ? portfolioChartHeight / 2
      : portfolioChartHeight -
        ((portfolioDisplayPrice - portfolioMin) / (portfolioMax - portfolioMin)) * (portfolioChartHeight - 12);

  const formatPortfolioHoverTime = (date, range) => {
    if (!date) return '';
    if (range === 'LIVE' || range === '1D') {
      return date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
    if (range === '1W' || range === '1M' || range === '3M') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const setPortfolioHoverFromX = (x) => {
    if (chartPointCount <= 1) return;
    const clampedX = Math.max(0, Math.min(portfolioChartWidth, x));
    const index = Math.round((clampedX / portfolioChartWidth) * (chartPointCount - 1));
    setHoveredPortfolioIndex(Math.max(0, Math.min(chartPointCount - 1, index)));
  };
  const needsLocationPrompt = Boolean(userProfile && (!userProfile.country || !userProfile.state));

  const formatMoney = (value) => {
    const numeric = Number(value || 0);
    return `$${numeric.toFixed(2)}`;
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
          <View style={styles.portfolioHeaderRow}>
            <View>
              <Text style={[styles.portfolioAccountType, { color: theme.colors.text }]}>
                Individual
              </Text>
              <Text style={[styles.portfolioPrimaryValue, { color: theme.colors.text }]}>
                ${Number(portfolioDisplayPrice || portfolioDisplayTotal).toFixed(2)}
              </Text>
              <Text
                style={[
                  styles.portfolioChangeLine,
                  { color: portfolioPositive ? theme.colors.positive : theme.colors.negative },
                ]}
              >
                {portfolioPositive ? '+' : '-'}${Math.abs(portfolioChange).toFixed(2)} (
                {portfolioPositive ? '+' : ''}
                {portfolioChangePct.toFixed(2)}%) {changePeriodLabel}
              </Text>
              <Text style={[styles.portfolioHoverLine, { color: theme.colors.placeholder }]}>
                {formatPortfolioHoverTime(portfolioDisplayTime, selectedPortfolioRange)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.portfolioBadge, { backgroundColor: '#f5be41' }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.75}
            >
              <Text style={styles.portfolioBadgeText}>$1M pie</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.portfolioBigChartWrap}>
            <LineChart
              data={{
                labels: new Array(portfolioChartData.length).fill(''),
                datasets: [
                  {
                    data: portfolioChartData,
                    color: () => (portfolioPositive ? theme.colors.positive : theme.colors.negative),
                    strokeWidth: 2.5,
                  },
                ],
              }}
              width={windowWidth - 72}
              height={portfolioChartHeight}
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
                color: () => (portfolioPositive ? theme.colors.positive : theme.colors.negative),
                labelColor: () => 'transparent',
                style: { borderRadius: 0 },
                propsForBackgroundLines: { strokeWidth: 0 },
                propsForDots: { r: '0' },
              }}
              bezier
              style={styles.portfolioChart}
            />
            <View
              style={[styles.portfolioChartInteractiveLayer, { width: portfolioChartWidth, height: portfolioChartHeight }]}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(event) => setPortfolioHoverFromX(event.nativeEvent.locationX)}
              onResponderMove={(event) => setPortfolioHoverFromX(event.nativeEvent.locationX)}
              onResponderRelease={() => setHoveredPortfolioIndex(null)}
              onResponderTerminate={() => setHoveredPortfolioIndex(null)}
              {...(Platform.OS === 'web'
                ? {
                    onMouseMove: (event) => setPortfolioHoverFromX(event.nativeEvent.offsetX),
                    onMouseLeave: () => setHoveredPortfolioIndex(null),
                  }
                : {})}
            >
              {hoveredPortfolioIndex !== null && (
                <>
                  <View
                    style={[
                      styles.portfolioCrosshair,
                      { left: Math.max(0, Math.min(portfolioChartWidth - 1, portfolioHoverX)) },
                    ]}
                  />
                  <View
                    style={[
                      styles.portfolioHoverDot,
                      {
                        left: Math.max(0, Math.min(portfolioChartWidth - 10, portfolioHoverX - 5)),
                        top: Math.max(0, Math.min(portfolioChartHeight - 10, portfolioHoverY - 5)),
                        backgroundColor: portfolioPositive ? theme.colors.positive : theme.colors.negative,
                      },
                    ]}
                  />
                </>
              )}
            </View>
          </View>

          <View style={[styles.holdingsSection, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.holdingsTitle, { color: theme.colors.text }]}>
              Current Holdings
            </Text>
            {holdings.length === 0 ? (
              <Text style={[styles.holdingsEmptyText, { color: theme.colors.placeholder }]}>
                You do not hold any positions yet.
              </Text>
            ) : (
              holdings.map((holding) => {
                const currentPrice = Number(holding.currentPrice ?? holding.avgPrice ?? 0);
                const avgPrice = Number(holding.avgPrice ?? 0);
                const shares = Number(holding.shares ?? 0);
                const marketValue = Number(holding.marketValue ?? shares * currentPrice);
                const gainLossDollar = Number(holding.gainLossDollar ?? (currentPrice - avgPrice) * shares);
                const gainLossPercent = Number(
                  holding.gainLossPercent ??
                    (avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0)
                );
                const positive = gainLossDollar >= 0;

                return (
                  <TouchableOpacity
                    key={holding.symbol}
                    onPress={() => navigation.navigate('StockDetail', { symbol: holding.symbol })}
                    style={[styles.holdingRow, { borderTopColor: theme.colors.border }]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.holdingLeft}>
                      <Text style={[styles.holdingSymbol, { color: theme.colors.text }]}>{holding.symbol}</Text>
                      <Text style={[styles.holdingMeta, { color: theme.colors.placeholder }]}>
                        {shares.toFixed(4).replace(/\.?0+$/, '')} shares
                      </Text>
                    </View>
                    <View style={styles.holdingRight}>
                      <Text style={[styles.holdingValue, { color: theme.colors.text }]}>
                        {formatMoney(marketValue)}
                      </Text>
                      <Text
                        style={[
                          styles.holdingPnL,
                          { color: positive ? theme.colors.positive : theme.colors.negative },
                        ]}
                      >
                        {positive ? '+' : '-'}{formatMoney(Math.abs(gainLossDollar))} ({positive ? '+' : ''}
                        {gainLossPercent.toFixed(2)}%)
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={[styles.portfolioTimeframeRow, { borderTopColor: theme.colors.border }]}>
            {portfolioRanges.map((label, index) => {
              const active = label === selectedPortfolioRange;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setSelectedPortfolioRange(label)}
                  style={[
                    styles.portfolioTimeframePill,
                    {
                      marginRight: index === portfolioRanges.length - 1 ? 0 : 8,
                      backgroundColor: active ? 'rgba(52, 199, 89, 0.15)' : 'transparent',
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.portfolioTimeframeInner}>
                    <Text
                      style={[
                        styles.portfolioTimeframeText,
                        { color: active ? theme.colors.positive : theme.colors.text },
                      ]}
                    >
                      {label}
                    </Text>
                    {label === 'LIVE' && active && (
                      <View
                        style={[
                          styles.liveDot,
                          { opacity: liveIndicatorOn ? 1 : 0.2 },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {portfolioSeriesLoading && (
              <Text style={[styles.portfolioUpdatingText, { color: theme.colors.placeholder }]}>
                Updating...
              </Text>
            )}
          </View>

          <View style={styles.portfolioActionsRow}>
            <TouchableOpacity
              style={[styles.portfolioActionButton, { backgroundColor: theme.colors.background, marginRight: 8 }]}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <Text style={[styles.portfolioActionText, { color: theme.colors.text }]}>
                Portfolio breakdown
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.portfolioActionButton, { backgroundColor: theme.colors.background }]}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={0.8}
            >
              <Text style={[styles.portfolioActionText, { color: theme.colors.text }]}>
                Trade
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.buyingPowerRow, { borderTopColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <View>
              <Text style={[styles.buyingPowerLabel, { color: theme.colors.text }]}>
                Buying power
              </Text>
              <Text style={[styles.buyingPowerSubtext, { color: theme.colors.placeholder }]}>
                Cash left to trade • {positionCount} position{positionCount === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={[styles.buyingPowerValue, { color: theme.colors.text }]}>
              ${buyingPower.toFixed(2)}
            </Text>
          </TouchableOpacity>
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

      {topGainers.length === 0 && topLosers.length === 0 && crypto.length === 0 && (
        <View style={styles.section}>
          <View style={[styles.emptyMarketCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.emptyMarketTitle, { color: theme.colors.text }]}>
              Market data temporarily unavailable
            </Text>
            <Text style={[styles.emptyMarketSubtitle, { color: theme.colors.placeholder }]}>
              Pull to refresh. If you are on Vercel, check provider API key status.
            </Text>
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
                    {isLogoUsable(item.symbol, item.logo) ? (
                      <Image
                        source={{ uri: item.logo }}
                        style={styles.logo}
                        onError={() => setBrokenLogos((prev) => ({ ...prev, [String(item.symbol || '').toUpperCase()]: true }))}
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
                      width={windowWidth - 120}
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

      <Modal visible={needsLocationPrompt} transparent animationType="fade">
        <View style={styles.locationPromptBackdrop}>
          <View style={[styles.locationPromptCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.locationPromptTitle, { color: theme.colors.text }]}>
              Complete Your Location
            </Text>
            <Text style={[styles.locationPromptText, { color: theme.colors.placeholder }]}>
              Please set your country and state/region in Profile.
            </Text>
            <Button mode="contained" onPress={() => navigation.navigate('Profile')} buttonColor={theme.colors.primary} textColor="#000">
              Go to Profile
            </Button>
          </View>
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
    justifyContent: 'flex-start',
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
  locationPromptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    padding: 20,
  },
  locationPromptCard: {
    borderRadius: 14,
    padding: 16,
  },
  locationPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  locationPromptText: {
    fontSize: 14,
    marginBottom: 14,
  },
  emptyMarketCard: {
    borderRadius: 14,
    padding: 18,
  },
  emptyMarketTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyMarketSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  portfolioCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 18,
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
  portfolioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  portfolioAccountType: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  portfolioPrimaryValue: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 42,
    marginBottom: 6,
  },
  portfolioChangeLine: {
    fontSize: 16,
    fontWeight: '700',
  },
  portfolioHoverLine: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  portfolioBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  portfolioBadgeText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
  portfolioBigChartWrap: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  portfolioChart: {
    marginLeft: -10,
    borderRadius: 0,
    paddingRight: 0,
    paddingLeft: 0,
  },
  portfolioChartInteractiveLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  portfolioCrosshair: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  portfolioHoverDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  portfolioTimeframeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  holdingsSection: {
    marginTop: 6,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  holdingsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  holdingsEmptyText: {
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 2,
  },
  holdingRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  holdingLeft: {
    flex: 1,
    paddingRight: 12,
  },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingSymbol: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  holdingMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  holdingValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  holdingPnL: {
    fontSize: 12,
    fontWeight: '700',
  },
  portfolioTimeframePill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
  },
  portfolioTimeframeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioTimeframeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
    backgroundColor: '#ef4444',
  },
  portfolioUpdatingText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  portfolioActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  portfolioActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  portfolioActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buyingPowerRow: {
    borderTopWidth: 1,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyingPowerLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  buyingPowerSubtext: {
    fontSize: 12,
  },
  buyingPowerValue: {
    fontSize: 22,
    fontWeight: '800',
  },
});
