import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

// 🚀 DEMO MODE: Set to true to use local storage instead of Firebase
const DEMO_MODE = false;
const getLocalFallbackKey = (uid) => `watchlist_fallback_${uid}`;
const DEMO_WATCHLIST_KEY = 'watchlist';

const readStoredValue = async (key) => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (error) {
    // fallback to AsyncStorage
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const writeStoredValue = async (key, value) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (error) {
    // fallback to AsyncStorage
  }
  await AsyncStorage.setItem(key, value);
};

const WatchlistContext = createContext({});

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (DEMO_MODE) {
        // Demo mode: Load from local storage
        const stored = await readStoredValue(DEMO_WATCHLIST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setWatchlist(parsed.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)));
        }
      } else {
        // Production mode: Load from Firebase
        const q = query(
          collection(db, 'watchlists'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        let mergedItems = items;
        const fallbackRaw = await readStoredValue(getLocalFallbackKey(user.uid));
        if (fallbackRaw) {
          const fallbackItems = JSON.parse(fallbackRaw);
          const existingSymbols = new Set(items.map((item) => item.symbol));
          mergedItems = [
            ...items,
            ...fallbackItems.filter((item) => !existingSymbols.has(item.symbol)),
          ];
        }
        setWatchlist(mergedItems.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)));
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol, name, metadata = {}) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const existingItem = watchlist.find((item) => item.symbol === symbol);
      if (existingItem) {
        return { success: true, alreadyExists: true };
      }

      const addedAt = new Date().toISOString();
      const localId = `wl-${Date.now()}`;
      const watchlistItem = {
        userId: user.uid,
        symbol,
        name,
        addedAt,
        addedPrice: typeof metadata.addedPrice === 'number' ? metadata.addedPrice : null,
        addedPriceCurrency: 'USD',
        logo: metadata.logo || null,
      };
      
      if (DEMO_MODE) {
        // Demo mode: Save to local storage
        const newWatchlist = [...watchlist, { id: localId, ...watchlistItem }];
        setWatchlist(newWatchlist.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)));
        await writeStoredValue(DEMO_WATCHLIST_KEY, JSON.stringify(newWatchlist));
      } else {
        // Production mode: Save to Firebase
        const docRef = await addDoc(collection(db, 'watchlists'), watchlistItem);
        const newItem = { ...watchlistItem, id: docRef.id };
        setWatchlist([...watchlist, newItem].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)));
      }
      return { success: true };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      // Fallback for local use if Firestore write is blocked (common rules/config issue)
      try {
        const fallbackKey = getLocalFallbackKey(user.uid);
        const existingRaw = await readStoredValue(fallbackKey);
        const existing = JSON.parse(existingRaw || '[]');
        if (!existing.some((item) => item.symbol === symbol)) {
          const fallbackItem = {
            id: `local-${Date.now()}`,
            userId: user.uid,
            symbol,
            name,
            addedAt: new Date().toISOString(),
            addedPrice: typeof metadata.addedPrice === 'number' ? metadata.addedPrice : null,
            addedPriceCurrency: 'USD',
            logo: metadata.logo || null,
            localOnly: true,
          };
          const next = [fallbackItem, ...existing];
          await writeStoredValue(fallbackKey, JSON.stringify(next));
          setWatchlist((prev) =>
            [fallbackItem, ...prev.filter((item) => item.symbol !== symbol)].sort(
              (a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
            )
          );
          return { success: true, localOnly: true };
        }
      } catch (fallbackError) {
        console.error('Local fallback add error:', fallbackError);
      }
      return { success: false, error: error.message };
    }
  };

  const removeFromWatchlist = async (id) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      if (DEMO_MODE) {
        // Demo mode: Remove from local storage
        const newWatchlist = watchlist.filter(item => item.id !== id);
        setWatchlist(newWatchlist);
        await writeStoredValue(DEMO_WATCHLIST_KEY, JSON.stringify(newWatchlist));
      } else {
        // Production mode: Remove from Firebase
        if (!String(id).startsWith('local-')) {
          await deleteDoc(doc(db, 'watchlists', id));
        }
        if (user?.uid) {
          const fallbackKey = getLocalFallbackKey(user.uid);
          const existingRaw = await readStoredValue(fallbackKey);
          const existing = JSON.parse(existingRaw || '[]');
          await writeStoredValue(fallbackKey, JSON.stringify(existing.filter((item) => item.id !== id)));
        }
        setWatchlist(watchlist.filter(item => item.id !== id));
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return { success: false, error: error.message };
    }
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(item => item.symbol === symbol);
  };

  const value = {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refreshWatchlist: fetchWatchlist,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};
