import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

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
        setPortfolio(portfolioDoc.data());
      } else {
        // Initialize portfolio with $1,000,000 fake money
        const initialPortfolio = {
          cash: STARTING_CASH,
          holdings: [],
          totalValue: STARTING_CASH,
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
            setPortfolio(JSON.parse(fallback));
          } else {
            setPortfolio({ cash: STARTING_CASH, holdings: [], totalValue: STARTING_CASH });
          }
        }
      } catch (fallbackError) {
        console.error('Error loading local portfolio fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const buyStock = async (symbol, shares, price) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const totalCost = shares * price;
    if (portfolio.cash < totalCost) {
      return { success: false, error: 'Insufficient funds' };
    }

    try {
      const updatedHoldings = [...portfolio.holdings];
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
      setPortfolio(updatedPortfolio);
      
      return { success: true };
    } catch (error) {
      console.error('Error buying stock:', error);
      try {
        const updatedHoldings = [...portfolio.holdings];
        const existingHolding = updatedHoldings.find(h => h.symbol === symbol);
        if (existingHolding) {
          const newShares = existingHolding.shares + shares;
          const avgPrice = ((existingHolding.shares * existingHolding.avgPrice) + totalCost) / newShares;
          existingHolding.shares = newShares;
          existingHolding.avgPrice = avgPrice;
        } else {
          updatedHoldings.push({ symbol, shares, avgPrice: price, purchaseDate: new Date().toISOString() });
        }
        const updatedPortfolio = { ...portfolio, cash: portfolio.cash - totalCost, holdings: updatedHoldings };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(updatedPortfolio));
        }
        setPortfolio(updatedPortfolio);
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

    try {
      const updatedHoldings = [...portfolio.holdings];
      const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
      
      if (holding.shares === shares) {
        updatedHoldings.splice(holdingIndex, 1);
      } else {
        updatedHoldings[holdingIndex].shares -= shares;
      }

      const proceeds = shares * price;
      const updatedPortfolio = {
        ...portfolio,
        cash: portfolio.cash + proceeds,
        holdings: updatedHoldings,
        totalValue: portfolio.totalValue,
      };

      await updateDoc(doc(db, 'portfolios', user.uid), updatedPortfolio);
      setPortfolio(updatedPortfolio);
      
      return { success: true };
    } catch (error) {
      console.error('Error selling stock:', error);
      try {
        const updatedHoldings = [...portfolio.holdings];
        const holdingIndex = updatedHoldings.findIndex(h => h.symbol === symbol);
        if (holdingIndex === -1 || updatedHoldings[holdingIndex].shares < shares) {
          return { success: false, error: 'Insufficient shares' };
        }
        if (updatedHoldings[holdingIndex].shares === shares) {
          updatedHoldings.splice(holdingIndex, 1);
        } else {
          updatedHoldings[holdingIndex].shares -= shares;
        }
        const updatedPortfolio = { ...portfolio, cash: portfolio.cash + proceeds, holdings: updatedHoldings };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(updatedPortfolio));
        }
        setPortfolio(updatedPortfolio);
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
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
