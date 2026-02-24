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

// Keep homepage market movers lightweight to avoid Finnhub free-tier rate limiting.
const MARKET_MOVER_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'AMD', 'JPM', 'V',
  'JNJ', 'WMT', 'PG', 'UNH', 'HD',
  'XOM', 'CVX', 'MRK', 'PEP', 'AMGN'
];

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'DOT']);

const getAxiosStatus = (error) => error?.response?.status;

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
  const snapshot = {
    gainers: validStocks
      .filter((stock) => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 20),
    losers: validStocks
      .filter((stock) => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 20),
  };

  setCachedData(cacheKey, snapshot);
  return snapshot;
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
      }
    }

    const finalQuote = quoteResponse?.data;
    if (!finalQuote || finalQuote.c === undefined || finalQuote.c === null) {
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

    setCachedData(cacheKey, stockData);
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

    const news = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage,
      content: article.content,
      author: article.author,
    }));

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('News error:', error.message);
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

    const news = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage,
      content: article.content,
      author: article.author,
    }));

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('WSJ news error:', error.message);
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

    const news = response.data.slice(0, 10).map((article) => ({
      title: article.headline,
      description: article.summary,
      source: article.source,
      url: article.url,
      publishedAt: new Date(article.datetime * 1000).toISOString(),
      imageUrl: article.image,
    }));

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

app.listen(PORT, () => {
  console.log(`🚀 StockScope API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n⚠️  Make sure to set your API keys in the .env file!`);
});
