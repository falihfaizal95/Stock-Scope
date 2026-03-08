import axios from 'axios';
import { Platform } from 'react-native';

const DEPLOYED_API_BASE_URL = 'https://stock-scope-falih-faizals-projects.vercel.app/api';

const getApiBaseUrl = () => {
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBase) return envBase;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window?.location) {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    if (origin) return `${origin}/api`;
  }

  return DEPLOYED_API_BASE_URL;
};

const API_BASE_URL = getApiBaseUrl();

export const stockAPI = {
  // Search for stocks
  searchStocks: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  },

  // Get stock details
  getStockDetails: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }
      return response.data;
    } catch (error) {
      console.error('Stock details error:', error);
      const backendMessage = error.response?.data?.error;
      if (error.response && error.response.status === 404) {
        throw new Error(backendMessage || 'Stock not found');
      }
      throw new Error(backendMessage || 'Failed to load stock details');
    }
  },

  getRelatedStocks: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/related`);
      return response.data;
    } catch (error) {
      console.error('Related stocks error:', error);
      return [];
    }
  },

  getStockEarnings: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/earnings`);
      return response.data;
    } catch (error) {
      console.error('Stock earnings error:', error);
      return [];
    }
  },

  getStockCandles: async (symbol, params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}/candles`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Stock candles error:', error);
      return { s: 'no_data', c: [], t: [] };
    }
  },

  // Get market overview
  getMarketOverview: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market/overview`);
      return response.data;
    } catch (error) {
      console.error('Market overview error:', error);
      throw error;
    }
  },

  // Get top gainers
  getTopGainers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market/gainers`);
      return response.data;
    } catch (error) {
      console.error('Top gainers error:', error);
      throw error;
    }
  },

  // Get top losers
  getTopLosers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market/losers`);
      return response.data;
    } catch (error) {
      console.error('Top losers error:', error);
      throw error;
    }
  },

  // Get crypto prices
  getCrypto: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/crypto`);
      return response.data;
    } catch (error) {
      console.error('Crypto error:', error);
      return [];
    }
  },
};

export const newsAPI = {
  // Get news feed
  getNewsFeed: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/news`);
      return response.data;
    } catch (error) {
      console.error('News feed error:', error);
      throw error;
    }
  },

  // Get Wall Street Journal news
  getWSJNews: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/news/wsj`);
      return response.data;
    } catch (error) {
      console.error('WSJ news error:', error);
      throw error;
    }
  },

  // Get news for specific symbol
  getStockNews: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/news/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Stock news error:', error);
      throw error;
    }
  },
};
