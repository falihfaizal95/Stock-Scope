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

    // Using Finnhub for search
    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${q}&token=${FINNHUB_API_KEY}`
    );

    const results = response.data.result.slice(0, 10).map((stock) => ({
      symbol: stock.symbol,
      name: stock.description,
      type: stock.type,
    }));

    setCachedData(cacheKey, results);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock details
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `stock_${symbol}`;
    
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get quote
    const quoteResponse = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    // Get company profile
    const profileResponse = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    const quote = quoteResponse.data;
    const profile = profileResponse.data;

    const stockData = {
      symbol: symbol,
      name: profile.name || symbol,
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      previousClose: quote.pc,
      volume: quote.v,
      marketCap: profile.marketCapitalization,
      week52High: profile.week52High,
      week52Low: profile.week52Low,
      logo: profile.logo,
      exchange: profile.exchange,
      industry: profile.finnhubIndustry,
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
    const cacheKey = 'top_gainers';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Popular stocks for demo
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    const stocks = await Promise.all(
      popularStocks.map(async (symbol) => {
        try {
          const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
          );
          const data = response.data;
          return {
            symbol,
            name: symbol, // You can enhance this with profile API
            price: data.c,
            change: data.d,
            changePercent: data.dp,
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
      .slice(0, 5);

    setCachedData(cacheKey, gainers);
    res.json(gainers);
  } catch (error) {
    console.error('Top gainers error:', error.message);
    res.status(500).json({ error: 'Failed to fetch top gainers' });
  }
});

// Get top losers
app.get('/api/market/losers', async (req, res) => {
  try {
    const cacheKey = 'top_losers';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Popular stocks for demo
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    const stocks = await Promise.all(
      popularStocks.map(async (symbol) => {
        try {
          const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
          );
          const data = response.data;
          return {
            symbol,
            name: symbol,
            price: data.c,
            change: data.d,
            changePercent: data.dp,
          };
        } catch (error) {
          return null;
        }
      })
    );

    const validStocks = stocks.filter(Boolean);
    const losers = validStocks
      .filter((stock) => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    setCachedData(cacheKey, losers);
    res.json(losers);
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
      `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=10&apiKey=${NEWS_API_KEY}`
    );

    const news = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage,
    }));

    setCachedData(cacheKey, news);
    res.json(news);
  } catch (error) {
    console.error('News error:', error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
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



