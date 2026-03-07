const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Middleware
app.use(cors());
app.use(express.json());

// API Keys (replace with your actual keys)
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_API_KEY';
const NEWS_API_KEY = process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY';

// Helper function to get cached data
const getCachedData = (key) => cache.get(key);
const setCachedData = (key, data) => cache.set(key, data);
let marketMoversSnapshotPromise = null;

// Keep homepage market movers lightweight to avoid Finnhub free-tier rate limiting.
const MARKET_MOVER_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'AMD', 'JPM', 'V',
  'JNJ', 'WMT', 'PG', 'UNH', 'HD',
  'XOM', 'CVX', 'MRK', 'PEP', 'AMGN'
];

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT']);
const DEMO_STOCKS = [
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 489.12, changePercent: 0.57, logo: 'https://logo.clearbit.com/invesco.com' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 532.46, changePercent: 0.41, logo: 'https://logo.clearbit.com/ssga.com' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 189.42, changePercent: 1.22, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png' },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 421.17, changePercent: 0.94, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/MSFT.png' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 903.11, changePercent: 2.11, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/NVDA.png' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', price: 181.56, changePercent: -0.42, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AMZN.png' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 172.98, changePercent: 0.35, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/GOOGL.png' },
  { symbol: 'META', name: 'Meta Platforms', price: 531.83, changePercent: -0.68, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/META.png' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 196.73, changePercent: 1.71, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/TSLA.png' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 171.24, changePercent: 1.38, logo: 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AMD.png' },
];
const DEMO_NEWS = [
  {
    title: 'Markets mixed as investors track rates and earnings',
    description: 'U.S. equities traded in a narrow range as investors weighed inflation and corporate updates.',
    source: 'Reuters',
    url: 'https://www.cnbc.com/markets/',
    publishedAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a?auto=format&fit=crop&w=1200&q=80',
    content: 'U.S. equities traded in a narrow range as investors weighed inflation prints and corporate guidance updates. Treasury yields were little changed as traders reassessed expectations for the Federal Reserve path into the next quarter.\n\nStrategists said sector leadership remained mixed, with technology and communications drawing selective inflows while energy and defensive groups underperformed. Market breadth stayed close to neutral, reflecting caution ahead of upcoming macro releases.\n\nInvestors will watch labor-market data and management commentary for signs of demand resilience, margin pressure, and capital spending trends that could influence positioning across major indices.',
    author: 'Reuters Staff',
  },
  {
    title: 'Tech stocks lead after strong AI demand outlook',
    description: 'Large-cap technology names outperformed on renewed AI infrastructure spending momentum.',
    source: 'Bloomberg',
    url: 'https://www.reuters.com/markets/',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
    content: 'Large-cap technology shares moved higher after several suppliers pointed to steady demand for AI servers and networking infrastructure. Analysts highlighted improving order visibility and durable cloud spending as supportive factors for earnings revisions.\n\nSemiconductor and software names were among the top contributors to index gains, while investors rotated into select hardware manufacturers tied to data center build-outs. Options activity also increased in megacap names, suggesting continued momentum participation.\n\nPortfolio managers said valuation remains a debate, but many continue to favor quality balance sheets and recurring revenue exposure as the market discounts long-cycle AI monetization.',
    author: 'Bloomberg News',
  },
  {
    title: 'Energy and financials hold steady ahead of economic data',
    description: 'Sector rotation remained balanced as traders awaited fresh macroeconomic releases.',
    source: 'CNBC',
    url: 'https://www.bloomberg.com/markets',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1642052502203-a2e4f4f1a4b7?auto=format&fit=crop&w=1200&q=80',
    content: 'Energy and financial shares were broadly unchanged as investors paused ahead of key economic updates. Crude prices traded in a tight range, while bank stocks tracked modest moves in long-duration yields.\n\nTraders noted that positioning remains light in cyclical sectors after recent volatility, creating room for either catch-up or further consolidation depending on data surprises. Credit spreads were stable, pointing to limited stress in funding markets.\n\nWith inflation and growth indicators due this week, market participants said near-term sector direction will likely depend on rates sensitivity and guidance revisions rather than headline momentum alone.',
    author: 'CNBC Markets',
  },
  {
    title: 'Small caps bounce as risk appetite improves into close',
    description: 'The Russell 2000 outperformed late in the session as investors rotated into cyclicals.',
    source: 'MarketWatch',
    url: 'https://www.marketwatch.com/markets',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
    content: 'Small-cap stocks outperformed in late trading as risk appetite improved and short-covering accelerated. Industrials and consumer discretionary names led gains, while defensive sectors lagged the broader move.\n\nDesk analysts said liquidity conditions were constructive into the close, with breadth metrics improving across domestic exchanges. The move came despite muted index-level volatility, indicating selective risk-taking rather than broad beta expansion.\n\nInvestors will monitor upcoming earnings from regional companies for signs of demand durability and margin stabilization that could sustain relative strength in the small-cap segment.',
    author: 'MarketWatch Staff',
  },
  {
    title: 'Treasury yields stabilize after choppy morning trading',
    description: 'Bond markets settled as traders reassessed policy expectations and growth data.',
    source: 'WSJ',
    url: 'https://www.wsj.com/finance',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    content: 'Treasury yields ended little changed after swinging through a wide intraday range. The two-year note briefly climbed before retracing as markets priced a slower path for policy easing.\n\nRate strategists pointed to mixed macro signals and cautious central-bank communication as reasons for elevated uncertainty in the front end. Curve dynamics remained volatile, with traders favoring tactical positioning around scheduled data releases.\n\nEquity participants said steadier yields into the close helped support growth sectors, though conviction remains limited until clearer direction emerges from inflation and labor figures.',
    author: 'WSJ Markets',
  },
  {
    title: 'Retail leaders outline cautious but steady consumer demand',
    description: 'Executives flagged promotions and value focus while maintaining full-year outlooks.',
    source: 'AP News',
    url: 'https://apnews.com/hub/business',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
    content: 'Retail executives said shoppers remain price-sensitive but continue to spend selectively across essential and seasonal categories. Promotional activity stayed elevated, particularly in discretionary products and apparel lines.\n\nManagement teams cited improvements in inventory health and logistics consistency compared with prior quarters. Analysts noted that gross margin trajectories are stabilizing as discount cadence becomes more predictable.\n\nWhile outlooks were largely unchanged, leadership teams emphasized monitoring household income trends and credit conditions as key variables for demand through the second half of the year.',
    author: 'AP Business',
  },
  {
    title: 'Chip equipment names rally on stronger booking commentary',
    description: 'Suppliers pointed to improving order pipelines tied to capacity upgrades.',
    source: 'Barron\'s',
    url: 'https://www.barrons.com/market-data',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    content: 'Semiconductor equipment stocks advanced after management commentary suggested improving bookings in key regions. Investors focused on signs that deferred spending plans are returning to active procurement cycles.\n\nThe move broadened to adjacent automation and materials providers, with analysts highlighting operating leverage potential if utilization rates continue to normalize. Volatility remained elevated but directional sentiment improved through the session.\n\nMarket participants said near-term upside may depend on confirmed shipment conversion and margin execution rather than headline order growth alone.',
    author: 'Barron\'s Team',
  },
  {
    title: 'Dollar edges lower as global equity flows rotate',
    description: 'Currency markets reflected shifting rate differentials and balanced risk demand.',
    source: 'Financial Times',
    url: 'https://www.ft.com/markets',
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=1200&q=80',
    content: 'The U.S. dollar softened modestly against major peers as capital flows favored international equities and commodity-linked currencies. FX desks cited calmer rate expectations and reduced haven demand as primary drivers.\n\nCross-asset correlations remained moderate, with equities gaining and bond volatility easing into the final hour. Commodity-sensitive currencies saw the strongest support as energy and industrial metals held firm.\n\nTraders said upcoming policy commentary from major central banks could reset short-term momentum, particularly if inflation trajectories diverge across developed economies.',
    author: 'FT Markets',
  },
];
const DEFAULT_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1642052502203-a2e4f4f1a4b7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
];

const normalizeNewsArticle = (article, index) => {
  if (!article || !article.title || article.title === '[Removed]') return null;
  const rawImage = article.urlToImage || article.image || article.imageUrl;
  const imageUrl = typeof rawImage === 'string' && rawImage.startsWith('http')
    ? rawImage
    : DEFAULT_NEWS_IMAGES[index % DEFAULT_NEWS_IMAGES.length];
  return {
    title: article.title,
    description: article.description || '',
    source: article.source?.name || article.source || 'Market Desk',
    url: article.url || null,
    publishedAt: article.publishedAt || new Date().toISOString(),
    imageUrl,
    content: article.content || article.summary || '',
    author: article.author || null,
  };
};

const getAxiosStatus = (error) => error?.response?.status;
const isProviderAuthError = (error) => {
  const status = getAxiosStatus(error);
  return status === 401 || status === 403;
};
const getDemoOverview = () => ({
  sp500: 5238.2,
  sp500Change: 0.44,
  nasdaq: 18204.7,
  nasdaqChange: 0.61,
  timestamp: new Date().toISOString(),
  stale: true,
});
const getDemoMovers = () => {
  const sorted = [...DEMO_STOCKS].sort((a, b) => b.changePercent - a.changePercent);
  return {
    gainers: sorted.filter((stock) => stock.changePercent >= 0).slice(0, 10),
    losers: sorted.filter((stock) => stock.changePercent < 0).slice(0, 10),
  };
};
const getDemoSearchResults = (query) => {
  const normalized = String(query || '').trim().toUpperCase();
  const filtered = DEMO_STOCKS.filter((stock) =>
    stock.symbol.includes(normalized) || stock.name.toUpperCase().includes(normalized)
  );
  const candidates = filtered.length > 0 ? filtered : DEMO_STOCKS.slice(0, 8);
  return candidates.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    type: 'Common Stock',
    price: stock.price,
    changePercent: stock.changePercent,
    logo: stock.logo,
    stale: true,
  }));
};
const getDemoStockData = (symbol) => {
  const normalized = String(symbol || '').toUpperCase();
  const match = DEMO_STOCKS.find((stock) => stock.symbol === normalized);
  if (!match) return null;
  return {
    symbol: normalized,
    name: match.name,
    price: match.price,
    change: Number((match.price * (match.changePercent / 100)).toFixed(2)),
    changePercent: match.changePercent,
    open: match.price * 0.995,
    high: match.price * 1.012,
    low: match.price * 0.988,
    previousClose: match.price * 0.99,
    volume: 12500000,
    marketCap: 2000000000000,
    week52High: match.price * 1.22,
    week52Low: match.price * 0.76,
    logo: match.logo,
    exchange: 'NASDAQ',
    industry: 'Technology',
    country: 'US',
    currency: 'USD',
    ipo: '1980-12-12',
    website: null,
    phone: null,
    shareOutstanding: 10000000,
    assetType: 'stock',
    stale: true,
  };
};

const buildFinnhubQuoteUrl = (symbol) =>
  `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;

const buildFinnhubProfileUrl = (symbol) =>
  `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
const buildFinnhubMetricUrl = (symbol) =>
  `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;

const getCachedProfileForSymbol = async (symbol) => {
  const cacheKey = `profile_${symbol}`;
  const cachedProfile = getCachedData(cacheKey);
  if (cachedProfile) return cachedProfile;

  try {
    const response = await axios.get(buildFinnhubProfileUrl(symbol));
    const profile = response.data || {};
    setCachedData(cacheKey, profile);
    return profile;
  } catch (error) {
    return {};
  }
};

const buildCachedAssetFallback = (symbol) => {
  const normalized = String(symbol || '').toUpperCase();
  const movers = getCachedData('market_movers_snapshot');
  const moverMatch =
    movers?.gainers?.find((item) => item.symbol === normalized) ||
    movers?.losers?.find((item) => item.symbol === normalized);

  if (moverMatch) {
    return {
      symbol: normalized,
      name: moverMatch.name || normalized,
      price: moverMatch.price,
      change: moverMatch.change,
      changePercent: moverMatch.changePercent,
      open: null,
      high: null,
      low: null,
      previousClose: null,
      volume: null,
      marketCap: null,
      week52High: null,
      week52Low: null,
      logo: moverMatch.logo || null,
      exchange: null,
      industry: null,
      assetType: 'stock',
      stale: true,
    };
  }

  const crypto = getCachedData('crypto_prices') || [];
  const cryptoMatch = crypto.find((item) => item.symbol === normalized);
  if (cryptoMatch) {
    return {
      symbol: normalized,
      name: cryptoMatch.name || normalized,
      price: cryptoMatch.price,
      change: null,
      changePercent: cryptoMatch.changePercent,
      open: null,
      high: null,
      low: null,
      previousClose: null,
      volume: null,
      marketCap: null,
      week52High: null,
      week52Low: null,
      logo: cryptoMatch.logo || null,
      exchange: 'CRYPTO',
      industry: null,
      assetType: 'crypto',
      stale: true,
    };
  }

  return null;
};

const getMarketMoversSnapshot = async () => {
  const cacheKey = 'market_movers_snapshot';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  if (marketMoversSnapshotPromise) return marketMoversSnapshotPromise;

  marketMoversSnapshotPromise = (async () => {
    const stocks = await Promise.all(
      MARKET_MOVER_SYMBOLS.map(async (symbol) => {
        try {
          const [quoteResponse, profile] = await Promise.all([
            axios.get(buildFinnhubQuoteUrl(symbol)),
            getCachedProfileForSymbol(symbol),
          ]);
          const data = quoteResponse.data;

          if (!data || data.c === undefined || data.c === null || data.dp === undefined || data.c <= 0) {
            return null;
          }

          return {
            symbol,
            name: profile.name || symbol,
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            logo: profile.logo || null,
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validStocks = stocks.filter(Boolean);
    const gainers = validStocks
      .filter((stock) => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 20);
    const losers = validStocks
      .filter((stock) => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 20);

    const demoMovers = getDemoMovers();
    const mergedGainers = [...gainers];
    demoMovers.gainers.forEach((demoStock) => {
      if (!mergedGainers.some((item) => item.symbol === demoStock.symbol)) {
        mergedGainers.push(demoStock);
      }
    });
    const mergedLosers = [...losers];
    demoMovers.losers.forEach((demoStock) => {
      if (!mergedLosers.some((item) => item.symbol === demoStock.symbol)) {
        mergedLosers.push(demoStock);
      }
    });

    const snapshot = {
      gainers: mergedGainers.slice(0, 20),
      losers: mergedLosers.slice(0, 20),
    };

    setCachedData(cacheKey, snapshot);
    return snapshot;
  })();

  try {
    return await marketMoversSnapshotPromise;
  } finally {
    marketMoversSnapshotPromise = null;
  }
};

// Search stocks
app.get('/api/stock/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const cacheKey = `search_${q}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Using Finnhub for search - increase results and include more types
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${q}&token=${FINNHUB_API_KEY}`
    );

    // Filter to include stocks, ETFs, crypto, and other securities
    // Don't filter - include all types to catch everything
    const allResults = response.data.result.slice(0, 100); // Return up to 100 results

    // Get additional data for each result
    const results = await Promise.all(
      allResults.map(async (stock) => {
        try {
          const [quoteResponse, profileResponse] = await Promise.all([
            axios.get(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} })),
            axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`).catch(() => ({ data: {} }))
          ]);
          
          return {
            symbol: stock.symbol,
            name: stock.description || profileResponse.data.name || stock.symbol,
            type: stock.type,
            price: quoteResponse.data.c,
            changePercent: quoteResponse.data.dp,
            logo: profileResponse.data.logo,
          };
        } catch (error) {
          return {
            symbol: stock.symbol,
            name: stock.description || stock.symbol,
            type: stock.type,
          };
        }
      })
    );

    setCachedData(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(getDemoSearchResults(req.query?.q));
    }
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock details
app.get('/api/stock/:symbol/related', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `related_${symbol}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const peersResponse = await axios.get(
      `https://finnhub.io/api/v1/stock/peers?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );

    const peers = Array.isArray(peersResponse.data) ? peersResponse.data.slice(0, 8) : [];
    const related = await Promise.all(
      peers.map(async (peerSymbol) => {
        try {
          const [quoteResponse, profileResponse] = await Promise.all([
            axios.get(buildFinnhubQuoteUrl(peerSymbol)),
            axios.get(buildFinnhubProfileUrl(peerSymbol)).catch(() => ({ data: {} })),
          ]);
          return {
            symbol: peerSymbol,
            name: profileResponse.data?.name || peerSymbol,
            logo: profileResponse.data?.logo || null,
            price: quoteResponse.data?.c,
            changePercent: quoteResponse.data?.dp,
            source: 'peer-comparison',
          };
        } catch (error) {
          return { symbol: peerSymbol, name: peerSymbol, source: 'peer-comparison' };
        }
      })
    );

    setCachedData(cacheKey, related);
    res.json(related);
  } catch (error) {
    console.error('Related stocks error:', error.message);
    res.status(500).json({ error: 'Failed to fetch related stocks' });
  }
});

app.get('/api/stock/:symbol/earnings', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `earnings_${symbol}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/earnings?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );

    const earnings = (Array.isArray(response.data) ? response.data : []).slice(0, 8).map((item) => ({
      period: item.period,
      actual: item.actual,
      estimate: item.estimate,
      surprise: item.surprise,
      surprisePercent: item.surprisePercent,
      quarter: item.quarter,
      year: item.year,
    }));

    setCachedData(cacheKey, earnings);
    res.json(earnings);
  } catch (error) {
    console.error('Earnings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch earnings reports' });
  }
});

app.get('/api/stock/:symbol/candles', async (req, res) => {
  try {
    const { symbol } = req.params;
    const normalizedSymbol = String(symbol || '').toUpperCase();
    const resolution = String(req.query.resolution || 'D').toUpperCase();
    const nowSec = Math.floor(Date.now() / 1000);
    const from = Number(req.query.from) || (nowSec - 30 * 24 * 60 * 60);
    const to = Number(req.query.to) || nowSec;

    const validResolutions = new Set(['1', '5', '15', '30', '60', 'D', 'W', 'M']);
    if (!validResolutions.has(resolution)) {
      return res.status(400).json({ error: 'Invalid resolution. Use 1,5,15,30,60,D,W,M' });
    }
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
      return res.status(400).json({ error: 'Invalid from/to range' });
    }

    const cacheKey = `candles_${normalizedSymbol}_${resolution}_${from}_${to}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const stockCandleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(normalizedSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    const cryptoCandleUrl = `https://finnhub.io/api/v1/crypto/candle?symbol=${encodeURIComponent(`BINANCE:${normalizedSymbol}USDT`)}&resolution=${encodeURIComponent(resolution)}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

    let response;
    let isCryptoAsset = CRYPTO_SYMBOLS.has(normalizedSymbol);
    try {
      response = await axios.get(isCryptoAsset ? cryptoCandleUrl : stockCandleUrl);
    } catch (error) {
      if (!isCryptoAsset) {
        try {
          response = await axios.get(cryptoCandleUrl);
          isCryptoAsset = true;
        } catch (cryptoError) {
          const status = getAxiosStatus(cryptoError) || getAxiosStatus(error);
          if (status === 429) {
            return res.status(429).json({ error: 'Market data provider rate limit exceeded. Please try again shortly.' });
          }
          return res.json({
            symbol: normalizedSymbol,
            assetType: 'stock',
            s: 'no_data',
            c: [],
            h: [],
            l: [],
            o: [],
            t: [],
            v: [],
          });
        }
      } else {
        const status = getAxiosStatus(error);
        if (status === 429) {
          return res.status(429).json({ error: 'Market data provider rate limit exceeded. Please try again shortly.' });
        }
        return res.json({
          symbol: normalizedSymbol,
          assetType: 'crypto',
          s: 'no_data',
          c: [],
          h: [],
          l: [],
          o: [],
          t: [],
          v: [],
        });
      }
    }

    const payload = response.data || {};
    const candles = {
      symbol: normalizedSymbol,
      assetType: isCryptoAsset ? 'crypto' : 'stock',
      s: payload.s || 'no_data',
      c: Array.isArray(payload.c) ? payload.c : [],
      h: Array.isArray(payload.h) ? payload.h : [],
      l: Array.isArray(payload.l) ? payload.l : [],
      o: Array.isArray(payload.o) ? payload.o : [],
      t: Array.isArray(payload.t) ? payload.t : [],
      v: Array.isArray(payload.v) ? payload.v : [],
    };

    setCachedData(cacheKey, candles);
    res.json(candles);
  } catch (error) {
    console.error('Candles error:', error.message);
    res.json({
      symbol: String(req.params.symbol || '').toUpperCase(),
      assetType: 'stock',
      s: 'no_data',
      c: [],
      h: [],
      l: [],
      o: [],
      t: [],
      v: [],
    });
  }
});

app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `stock_${symbol}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get quote - handle errors gracefully
    let quoteResponse, profileResponse, metricResponse;
    let isCryptoAsset = false;
    const normalizedSymbol = String(symbol || '').toUpperCase();
    const cryptoQuoteSymbol = `BINANCE:${normalizedSymbol}USDT`;
    try {
      quoteResponse = await axios.get(buildFinnhubQuoteUrl(symbol));
    } catch (error) {
      if (CRYPTO_SYMBOLS.has(normalizedSymbol)) {
        try {
          quoteResponse = await axios.get(buildFinnhubQuoteUrl(cryptoQuoteSymbol));
          isCryptoAsset = true;
        } catch (cryptoError) {
          const cryptoStatus = getAxiosStatus(cryptoError);
          console.error('Crypto quote error:', cryptoError.message);
          if (cryptoStatus === 429) {
            const cachedFallback = buildCachedAssetFallback(normalizedSymbol);
            if (cachedFallback) {
              return res.json(cachedFallback);
            }
            return res.status(429).json({ error: 'Market data provider rate limit exceeded. Please try again shortly.' });
          }
          if (isProviderAuthError(cryptoError)) {
            const demoFallback = getDemoStockData(normalizedSymbol);
            if (demoFallback) return res.json(demoFallback);
          }
          return res.status(404).json({ error: 'Asset not found' });
        }
      } else {
        const status = getAxiosStatus(error);
        console.error('Quote error:', error.message);
        if (status === 429) {
          const cachedFallback = buildCachedAssetFallback(normalizedSymbol);
          if (cachedFallback) {
            return res.json(cachedFallback);
          }
          return res.status(429).json({ error: 'Market data provider rate limit exceeded. Please try again shortly.' });
        }
        if (isProviderAuthError(error)) {
          const demoFallback = getDemoStockData(normalizedSymbol);
          if (demoFallback) return res.json(demoFallback);
        }
        return res.status(404).json({ error: 'Stock not found' });
      }
    }

    // Get company profile - optional, don't fail if missing
    if (!isCryptoAsset) {
      try {
        profileResponse = await axios.get(buildFinnhubProfileUrl(symbol));
      } catch (error) {
        console.error('Profile error:', error.message);
        profileResponse = { data: {} };
      }
    } else {
      profileResponse = { data: {} };
    }

    if (!isCryptoAsset) {
      try {
        metricResponse = await axios.get(buildFinnhubMetricUrl(symbol));
      } catch (error) {
        metricResponse = { data: { metric: {} } };
      }
    } else {
      metricResponse = { data: { metric: {} } };
    }

    const quote = quoteResponse.data;
    const profile = profileResponse.data || {};
    const metric = metricResponse?.data?.metric || {};

    // Validate quote data
    if ((!quote || quote.c === undefined || quote.c === null) && CRYPTO_SYMBOLS.has(normalizedSymbol) && !isCryptoAsset) {
      try {
        quoteResponse = await axios.get(buildFinnhubQuoteUrl(cryptoQuoteSymbol));
        isCryptoAsset = true;
      } catch (error) {
        const status = getAxiosStatus(error);
        if (status === 429) {
          const cachedFallback = buildCachedAssetFallback(normalizedSymbol);
          if (cachedFallback) {
            return res.json(cachedFallback);
          }
          return res.status(429).json({ error: 'Market data provider rate limit exceeded. Please try again shortly.' });
        }
        if (isProviderAuthError(error)) {
          const demoFallback = getDemoStockData(normalizedSymbol);
          if (demoFallback) return res.json(demoFallback);
        }
      }
    }

    const finalQuote = quoteResponse?.data;
    if (!finalQuote || finalQuote.c === undefined || finalQuote.c === null) {
      const demoFallback = getDemoStockData(normalizedSymbol);
      if (demoFallback) return res.json(demoFallback);
      return res.status(404).json({ error: isCryptoAsset ? 'Crypto data not available' : 'Stock data not available' });
    }

    const stockData = {
      symbol: symbol,
      name: isCryptoAsset
        ? ({
            BTC: 'Bitcoin',
            ETH: 'Ethereum',
            BNB: 'BNB',
            SOL: 'Solana',
            ADA: 'Cardano',
            XRP: 'XRP',
            DOGE: 'Dogecoin',
            DOT: 'Polkadot',
          }[normalizedSymbol] || normalizedSymbol)
        : (profile.name || symbol),
      price: finalQuote.c,
      change: finalQuote.d,
      changePercent: finalQuote.dp,
      open: finalQuote.o,
      high: finalQuote.h,
      low: finalQuote.l,
      previousClose: finalQuote.pc,
      volume: finalQuote.v,
      marketCap: profile.marketCapitalization,
      week52High: profile.week52High,
      week52Low: profile.week52Low,
      peRatio: metric.peBasicExclExtraTTM ?? metric.peTTM ?? null,
      dividendYield: metric.dividendYieldIndicatedAnnual ?? metric.dividendYield5YAvg ?? null,
      avgVolume: metric['10DayAverageTradingVolume'] ?? metric['3MonthAverageTradingVolume'] ?? null,
      sharesOutstanding: metric.shareOutstandingBasic ?? null,
      beta: metric.beta ?? null,
      epsTTM: metric.epsBasicExclExtraItemsTTM ?? metric.epsTTM ?? null,
      logo: profile.logo,
      exchange: profile.exchange,
      industry: profile.finnhubIndustry,
      country: profile.country,
      currency: profile.currency,
      ipo: profile.ipo,
      website: profile.weburl,
      phone: profile.phone,
      shareOutstanding: profile.shareOutstanding,
      assetType: isCryptoAsset ? 'crypto' : 'stock',
    };

    // Keep quote-level cache short so portfolio valuation updates feel live.
    cache.set(cacheKey, stockData, 20);
    res.json(stockData);
  } catch (error) {
    console.error('Stock details error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock details' });
  }
});

// Get market overview
app.get('/api/market/overview', async (req, res) => {
  try {
    const cacheKey = 'market_overview';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get major indices
    const [spy, qqq] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/quote?symbol=QQQ&token=${FINNHUB_API_KEY}`),
    ]);

    const overview = {
      sp500: spy.data.c,
      sp500Change: spy.data.dp,
      nasdaq: qqq.data.c,
      nasdaqChange: qqq.data.dp,
      timestamp: new Date().toISOString(),
    };

    setCachedData(cacheKey, overview);
    res.json(overview);
  } catch (error) {
    console.error('Market overview error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(getDemoOverview());
    }
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
});

// Get top gainers
app.get('/api/market/gainers', async (req, res) => {
  try {
    const snapshot = await getMarketMoversSnapshot();
    res.json(snapshot.gainers);
  } catch (error) {
    console.error('Top gainers error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(getDemoMovers().gainers);
    }
    res.status(500).json({ error: 'Failed to fetch top gainers' });
  }
});

// Get top losers
app.get('/api/market/losers', async (req, res) => {
  try {
    const snapshot = await getMarketMoversSnapshot();
    res.json(snapshot.losers);
  } catch (error) {
    console.error('Top losers error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(getDemoMovers().losers);
    }
    res.status(500).json({ error: 'Failed to fetch top losers' });
  }
});

// Get general news
app.get('/api/news', async (req, res) => {
  try {
    const cacheKey = 'general_news';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Using NewsAPI
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=20&apiKey=${NEWS_API_KEY}`
    );

    const mapped = (Array.isArray(response.data?.articles) ? response.data.articles : [])
      .map((article, index) => normalizeNewsArticle(article, index))
      .filter(Boolean);
    const news = [...mapped];
    DEMO_NEWS.forEach((demoArticle, index) => {
      if (news.length >= 12) return;
      if (!news.some((item) => item.title === demoArticle.title)) {
        news.push(normalizeNewsArticle(demoArticle, mapped.length + index));
      }
    });

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('News error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(DEMO_NEWS);
    }
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get crypto prices
app.get('/api/crypto', async (req, res) => {
  try {
    const cacheKey = 'crypto_prices';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Popular cryptocurrencies
    const cryptoList = ['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD', 'DOGE-USD', 'DOT-USD'];
    
    const crypto = await Promise.all(
      cryptoList.map(async (symbol) => {
        try {
          // Using Finnhub crypto symbol format
          const finnhubSymbol = symbol.replace('-USD', '');
          const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=BINANCE:${finnhubSymbol}USDT&token=${FINNHUB_API_KEY}`
          );
          const data = response.data;
          
          if (!data.c || data.dp === undefined) return null;
          
          return {
            symbol: finnhubSymbol,
            name: finnhubSymbol === 'BTC' ? 'Bitcoin' : finnhubSymbol === 'ETH' ? 'Ethereum' : finnhubSymbol,
            price: data.c,
            changePercent: data.dp,
            logo: null,
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validCrypto = crypto.filter(Boolean);
    setCachedData(cacheKey, validCrypto);
    res.json(validCrypto);
  } catch (error) {
    console.error('Crypto error:', error.message);
    res.status(500).json({ error: 'Failed to fetch crypto' });
  }
});

// Get Wall Street Journal news
app.get('/api/news/wsj', async (req, res) => {
  try {
    const cacheKey = 'wsj_news';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Using NewsAPI with WSJ source
    const response = await axios.get(
      `https://newsapi.org/v2/everything?sources=the-wall-street-journal&pageSize=10&apiKey=${NEWS_API_KEY}`
    );

    const mapped = (Array.isArray(response.data?.articles) ? response.data.articles : [])
      .map((article, index) => normalizeNewsArticle(article, index))
      .filter(Boolean);
    const news = [...mapped];
    DEMO_NEWS.forEach((demoArticle, index) => {
      if (news.length >= 10) return;
      if (!news.some((item) => item.title === demoArticle.title)) {
        news.push(normalizeNewsArticle(demoArticle, mapped.length + index));
      }
    });

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('WSJ news error:', error.message);
    if (isProviderAuthError(error) || getAxiosStatus(error) === 429) {
      return res.json(DEMO_NEWS);
    }
    res.status(500).json({ error: 'Failed to fetch WSJ news' });
  }
});

// Get stock-specific news
app.get('/api/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `news_${symbol}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Using Finnhub for stock news
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`
    );

    const news = response.data.slice(0, 12).map((article, index) => normalizeNewsArticle({
      title: article.headline,
      description: article.summary,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      image: article.image,
      content: article.summary,
      author: null,
    }, index)).filter(Boolean);

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('Stock news error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock news' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 StockScope API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`\n⚠️  Make sure to set your API keys in the .env file!`);
  });
}

module.exports = app;
