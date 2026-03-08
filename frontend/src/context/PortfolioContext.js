import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { stockAPI } from '../utils/api';

const PortfolioContext = createContext({});
const STARTING_CASH = 1000000;
const getPortfolioFallbackKey = (uid) => `portfolio_fallback_${uid}`;
const QUEUE_PROCESS_INTERVAL_MS = 15000;

const getEasternDateParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const pieces = formatter.formatToParts(date);
  const map = {};
  pieces.forEach((item) => {
    if (item.type !== 'literal') map[item.type] = item.value;
  });
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: map.weekday,
  };
};

const formatYmd = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getWeekday = (year, month, day) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();

const nthWeekdayOfMonth = (year, month, weekday, nth) => {
  let count = 0;
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1) break;
    if (date.getUTCDay() === weekday) {
      count += 1;
      if (count === nth) return day;
    }
  }
  return null;
};

const lastWeekdayOfMonth = (year, month, weekday) => {
  for (let day = 31; day >= 1; day -= 1) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1) continue;
    if (date.getUTCDay() === weekday) return day;
  }
  return null;
};

const observedHolidayYmd = (year, month, day) => {
  const weekday = getWeekday(year, month, day);
  if (weekday === 6) {
    const observed = new Date(Date.UTC(year, month - 1, day - 1));
    return formatYmd(observed.getUTCFullYear(), observed.getUTCMonth() + 1, observed.getUTCDate());
  }
  if (weekday === 0) {
    const observed = new Date(Date.UTC(year, month - 1, day + 1));
    return formatYmd(observed.getUTCFullYear(), observed.getUTCMonth() + 1, observed.getUTCDate());
  }
  return formatYmd(year, month, day);
};

const getGoodFridayDay = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, easterMonth - 1, easterDay));
  const goodFriday = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
  return formatYmd(goodFriday.getUTCFullYear(), goodFriday.getUTCMonth() + 1, goodFriday.getUTCDate());
};

const isUsMarketHoliday = (year, month, day) => {
  const ymd = formatYmd(year, month, day);
  const holidays = new Set([
    observedHolidayYmd(year, 1, 1),
    formatYmd(year, 1, nthWeekdayOfMonth(year, 1, 1, 3)),
    formatYmd(year, 2, nthWeekdayOfMonth(year, 2, 1, 3)),
    getGoodFridayDay(year),
    formatYmd(year, 5, lastWeekdayOfMonth(year, 5, 1)),
    observedHolidayYmd(year, 6, 19),
    observedHolidayYmd(year, 7, 4),
    formatYmd(year, 9, nthWeekdayOfMonth(year, 9, 1, 1)),
    formatYmd(year, 11, nthWeekdayOfMonth(year, 11, 4, 4)),
    observedHolidayYmd(year, 12, 25),
  ]);
  return holidays.has(ymd);
};

const isUsRegularMarketOpenEt = (date = new Date()) => {
  const eastern = getEasternDateParts(date);
  const isWeekend = eastern.weekday === 'Sat' || eastern.weekday === 'Sun';
  if (isWeekend) return false;
  if (isUsMarketHoliday(eastern.year, eastern.month, eastern.day)) return false;
  const minutes = eastern.hour * 60 + eastern.minute;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
};

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
    queuedOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const portfolioRef = useRef(portfolio);
  const processingQueuedOrdersRef = useRef(false);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

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
          queuedOrders: [],
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
          queuedOrders: [],
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
              queuedOrders: [],
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
              queuedOrders: [],
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

  const persistPortfolio = async (updatedPortfolio) => {
    setPortfolio(updatedPortfolio);
    try {
      await updateDoc(doc(db, 'portfolios', user.uid), updatedPortfolio);
    } catch (error) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(getPortfolioFallbackKey(user.uid), JSON.stringify(updatedPortfolio));
      }
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    const intervalId = setInterval(() => {
      refreshPortfolioValuation();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [user, portfolio.cash, portfolio.holdings?.length]);

  const processQueuedOrders = async () => {
    if (!user || processingQueuedOrdersRef.current) return;
    if (!isUsRegularMarketOpenEt()) return;
    const currentPortfolio = portfolioRef.current;
    const queuedOrders = Array.isArray(currentPortfolio?.queuedOrders) ? currentPortfolio.queuedOrders : [];
    if (!queuedOrders.length) return;

    processingQueuedOrdersRef.current = true;
    try {
      const sortedOrders = [...queuedOrders].sort((a, b) => {
        const aTs = new Date(a?.placedAt || 0).getTime() || 0;
        const bTs = new Date(b?.placedAt || 0).getTime() || 0;
        return aTs - bTs;
      });

      const priceCache = {};
      const nextPortfolio = {
        ...currentPortfolio,
        holdings: (currentPortfolio.holdings || []).map((holding) => ({ ...holding })),
        queuedOrders: [],
      };

      for (const order of sortedOrders) {
        const symbol = String(order?.symbol || '').toUpperCase();
        const side = order?.side;
        const shares = Number(order?.shares);
        if (!symbol || !['buy', 'sell'].includes(side) || !Number.isFinite(shares) || shares <= 0) {
          continue;
        }

        if (typeof priceCache[symbol] !== 'number') {
          try {
            const stock = await stockAPI.getStockDetails(symbol);
            priceCache[symbol] = Number(stock?.price);
          } catch (error) {
            priceCache[symbol] = NaN;
          }
        }
        const executionPrice = Number(priceCache[symbol]);
        if (!Number.isFinite(executionPrice) || executionPrice <= 0) {
          continue;
        }

        if (side === 'buy') {
          const totalCost = shares * executionPrice;
          if ((nextPortfolio.cash || 0) < totalCost) {
            continue;
          }
          const existingHolding = nextPortfolio.holdings.find((h) => h.symbol === symbol);
          if (existingHolding) {
            const newShares = existingHolding.shares + shares;
            existingHolding.avgPrice =
              ((existingHolding.shares * existingHolding.avgPrice) + totalCost) / newShares;
            existingHolding.shares = newShares;
          } else {
            nextPortfolio.holdings.push({
              symbol,
              shares,
              avgPrice: executionPrice,
              purchaseDate: new Date().toISOString(),
            });
          }
          nextPortfolio.cash = (nextPortfolio.cash || 0) - totalCost;
        } else {
          const holdingIndex = nextPortfolio.holdings.findIndex((h) => h.symbol === symbol);
          if (holdingIndex === -1) {
            continue;
          }
          const holding = nextPortfolio.holdings[holdingIndex];
          if (holding.shares < shares) {
            continue;
          }
          if (holding.shares === shares) {
            nextPortfolio.holdings.splice(holdingIndex, 1);
          } else {
            nextPortfolio.holdings[holdingIndex] = {
              ...holding,
              shares: holding.shares - shares,
            };
          }
          nextPortfolio.cash = (nextPortfolio.cash || 0) + (shares * executionPrice);
        }
      }

      await refreshPortfolioValuation(nextPortfolio);
    } catch (error) {
      console.error('Error processing queued orders:', error);
    } finally {
      processingQueuedOrdersRef.current = false;
    }
  };

  useEffect(() => {
    if (!user) return undefined;
    processQueuedOrders();
    const intervalId = setInterval(() => {
      processQueuedOrders();
    }, QUEUE_PROCESS_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [user]);

  const queueStockOrder = async (side, symbol, shares, requestedPrice = null) => {
    if (!user) return { success: false, error: 'Not logged in' };
    if (!['buy', 'sell'].includes(side)) return { success: false, error: 'Invalid order side' };
    const parsedShares = Number(shares);
    if (!Number.isFinite(parsedShares) || parsedShares <= 0) {
      return { success: false, error: 'Invalid share quantity' };
    }

    const currentPortfolio = portfolioRef.current;
    const nextPortfolio = {
      ...currentPortfolio,
      queuedOrders: [
        ...(Array.isArray(currentPortfolio.queuedOrders) ? currentPortfolio.queuedOrders : []),
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          side,
          symbol: String(symbol || '').toUpperCase(),
          shares: parsedShares,
          requestedPrice: Number(requestedPrice) || null,
          placedAt: new Date().toISOString(),
        },
      ],
    };

    await persistPortfolio(nextPortfolio);
    return { success: true };
  };

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

      await persistPortfolio(updatedPortfolio);
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
        await persistPortfolio(updatedPortfolio);
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

      await persistPortfolio(updatedPortfolio);
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
        await persistPortfolio(updatedPortfolio);
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
    queueStockOrder,
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
