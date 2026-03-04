import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { stockAPI } from '../utils/api';

const PortfolioContext = createContext({});
const STARTING_CASH = 1000000;
const getPortfolioFallbackKey = (uid) => `portfolio_fallback_${uid}`;

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState({
    cash: STARTING_CASH, // Starting fake money: $1,000,000
    holdings: [],
    totalValue: STARTING_CASH,
    history: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPortfolio();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPortfolio = async () => {
    if (!user) return;
    
    try {
      const portfolioDoc = await getDoc(doc(db, 'portfolios', user.uid));
      if (portfolioDoc.exists()) {
        const loadedPortfolio = {
          cash: STARTING_CASH,
          holdings: [],
          totalValue: STARTING_CASH,
          history: [],
          ...portfolioDoc.data(),
        };
        setPortfolio(loadedPortfolio);
        await refreshPortfolioValuation(loadedPortfolio);
      } else {
        // Initialize portfolio with $1,000,000 fake money
        const initialPortfolio = {
          cash: STARTING_CASH,
          holdings: [],
          totalValue: STARTING_CASH,
          history: [{ value: STARTING_CASH, timestamp: new Date().toISOString() }],
        };
        await setDoc(doc(db, 'portfolios', user.uid), initialPortfolio);
        setPortfolio(initialPortfolio);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      try {
        if (typeof localStorage !== 'undefined') {
          const fallback = localStorage.getItem(getPortfolioFallbackKey(user.uid));
          if (fallback) {
            const localPortfolio = {
              cash: STARTING_CASH,
              holdings: [],
              totalValue: STARTING_CASH,
              history: [],
              ...JSON.parse(fallback),
            };
            setPortfolio(localPortfolio);
            await refreshPortfolioValuation(localPortfolio);
          } else {
            setPortfolio({
              cash: STARTING_CASH,
              holdings: [],
              totalValue: STARTING_CASH,
              history: [{ value: STARTING_CASH, timestamp: new Date().toISOString() }],
            });
          }
        }
      } catch (fallbackError) {
        console.error('Error loading local portfolio fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPrices = async (symbols = []) => {
    const uniqueSymbols = [...new Set(symbols.filter(Boolean))];
    if (uniqueSymbols.length === 0) return {};

    const results = await Promise.allSettled(
      uniqueSymbols.map(async (symbol) => {
        const stock = await stockAPI.getStockDetails(symbol);
        return { symbol, price: stock?.price };
      })
    );

    return results.reduce((acc, result) => {
      if (result.status !== 'fulfilled') return acc;
      const { symbol, price } = result.value;
      if (typeof price === 'number' && Number.isFinite(price)) {
        acc[symbol] = price;
      }
      return acc;
    }, {});
  };

  const buildValuatedPortfolio = async (basePortfolio) => {
    const currentPrices = await getCurrentPrices((basePortfolio.holdings || []).map((h) => h.symbol));
    let holdingsValue = 0;

    const holdings = (basePortfolio.holdings || []).map((holding) => {
      const currentPrice = currentPrices[holding.symbol] ?? holding.currentPrice ?? holding.avgPrice;
      const marketValue = holding.shares * currentPrice;
      const costBasis = holding.shares * (holding.avgPrice || 0);
      const gainLossDollar = marketValue - costBasis;
      const gainLossPercent = costBasis > 0 ? (gainLossDollar / costBasis) * 100 : 0;
      holdingsValue += marketValue;

      return {
        ...holding,
        currentPrice,
        marketValue,
        gainLossDollar,
        gainLossPercent,
      };
    });

    const totalValue = (basePortfolio.cash || 0) + holdingsValue;
    const history = [...(basePortfolio.history || []), { value: totalValue, timestamp: new Date().toISOString() }]
      .slice(-200);

    return {
      ...basePortfolio,
      holdings,
      totalValue,
      history,
    };
  };

  const refreshPortfolioValuation = async (sourcePortfolio = portfolio) => {
    if (!user || !sourcePortfolio) return;

    try {
      const valuatedPortfolio = await buildValuatedPortfolio(sourcePortfolio);
      setPortfolio(valuatedPortfolio);

      try {
        await updateDoc(doc(db, 'portfolios', user.uid), valuatedPortfolio);
      } catch (error) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(valuatedPortfolio));
        }
      }
    } catch (error) {
      console.error('Error refreshing portfolio valuation:', error);
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    const intervalId = setInterval(() => {
      refreshPortfolioValuation();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [user, portfolio.cash, portfolio.holdings?.length]);

  const buyStock = async (symbol, shares, price) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const totalCost = shares * price;
    if (portfolio.cash < totalCost) {
      return { success: false, error: 'Insufficient funds' };
    }

    try {
      const updatedHoldings = portfolio.holdings.map((holding) => ({ ...holding }));
      const existingHolding = updatedHoldings.find(h => h.symbol === symbol);
      
      if (existingHolding) {
        const newShares = existingHolding.shares + shares;
        const avgPrice = ((existingHolding.shares * existingHolding.avgPrice) + totalCost) / newShares;
        existingHolding.shares = newShares;
        existingHolding.avgPrice = avgPrice;
      } else {
        updatedHoldings.push({
          symbol,
          shares,
          avgPrice: price,
          purchaseDate: new Date().toISOString(),
        });
      }

      const updatedPortfolio = {
        ...portfolio,
        cash: portfolio.cash - totalCost,
        holdings: updatedHoldings,
        totalValue: portfolio.totalValue,
      };

      await updateDoc(doc(db, 'portfolios', user.uid), updatedPortfolio);
      await refreshPortfolioValuation(updatedPortfolio);
      
      return { success: true };
    } catch (error) {
      console.error('Error buying stock:', error);
      try {
        const updatedHoldings = portfolio.holdings.map((holding) => ({ ...holding }));
        const existingHolding = updatedHoldings.find(h => h.symbol === symbol);
        if (existingHolding) {
          const newShares = existingHolding.shares + shares;
          const avgPrice = ((existingHolding.shares * existingHolding.avgPrice) + totalCost) / newShares;
          existingHolding.shares = newShares;
          existingHolding.avgPrice = avgPrice;
        } else {
          updatedHoldings.push({ symbol, shares, avgPrice: price, purchaseDate: new Date().toISOString() });
        }
        const updatedPortfolio = {
          ...portfolio,
          cash: portfolio.cash - totalCost,
          holdings: updatedHoldings,
          totalValue: portfolio.totalValue,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(updatedPortfolio));
        }
        await refreshPortfolioValuation(updatedPortfolio);
        return { success: true, localOnly: true };
      } catch (fallbackError) {
        return { success: false, error: error.message || fallbackError.message };
      }
    }
  };

  const sellStock = async (symbol, shares, price) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    if (!holding || holding.shares < shares) {
      return { success: false, error: 'Insufficient shares' };
    }
    const proceeds = shares * price;

    try {
      const updatedHoldings = portfolio.holdings.map((item) => ({ ...item }));
      const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
      
      if (holding.shares === shares) {
        updatedHoldings.splice(holdingIndex, 1);
      } else {
        updatedHoldings[holdingIndex].shares -= shares;
      }

      const updatedPortfolio = {
        ...portfolio,
        cash: portfolio.cash + proceeds,
        holdings: updatedHoldings,
        totalValue: portfolio.totalValue,
      };

      await updateDoc(doc(db, 'portfolios', user.uid), updatedPortfolio);
      await refreshPortfolioValuation(updatedPortfolio);
      
      return { success: true };
    } catch (error) {
      console.error('Error selling stock:', error);
      try {
        const updatedHoldings = portfolio.holdings.map((item) => ({ ...item }));
        const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
        if (holdingIndex === -1 || updatedHoldings[holdingIndex].shares < shares) {
          return { success: false, error: 'Insufficient shares' };
        }
        if (updatedHoldings[holdingIndex].shares === shares) {
          updatedHoldings.splice(holdingIndex, 1);
        } else {
          updatedHoldings[holdingIndex].shares -= shares;
        }
        const updatedPortfolio = {
          ...portfolio,
          cash: portfolio.cash + proceeds,
          holdings: updatedHoldings,
          totalValue: portfolio.totalValue,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(updatedPortfolio));
        }
        await refreshPortfolioValuation(updatedPortfolio);
        return { success: true, localOnly: true };
      } catch (fallbackError) {
        return { success: false, error: error.message || fallbackError.message };
      }
    }
  };

  const calculateTotalValue = async (currentPrices) => {
    let holdingsValue = 0;
    portfolio.holdings.forEach(holding => {
      const currentPrice = currentPrices[holding.symbol] || holding.avgPrice;
      holdingsValue += holding.shares * currentPrice;
    });
    
    const totalValue = portfolio.cash + holdingsValue;
    return { totalValue, holdingsValue };
  };

  const value = {
    portfolio,
    loading,
    buyStock,
    sellStock,
    calculateTotalValue,
    refreshPortfolio: loadPortfolio,
    refreshPortfolioValuation,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
