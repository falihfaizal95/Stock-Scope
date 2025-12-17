import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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
      return response.data;
    } catch (error) {
      console.error('Stock details error:', error);
      throw error;
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



