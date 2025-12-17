import React, { createContext, useState, useContext, useEffect } from 'react';
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
        // Demo mode: Load from localStorage
        const stored = localStorage.getItem('watchlist');
        if (stored) {
          setWatchlist(JSON.parse(stored));
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
        setWatchlist(items);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol, name) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const watchlistItem = {
        id: `demo-${Date.now()}`,
        userId: user.uid,
        symbol,
        name,
        addedAt: new Date().toISOString(),
      };
      
      if (DEMO_MODE) {
        // Demo mode: Save to localStorage
        const newWatchlist = [...watchlist, watchlistItem];
        setWatchlist(newWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
      } else {
        // Production mode: Save to Firebase
        const docRef = await addDoc(collection(db, 'watchlists'), watchlistItem);
        setWatchlist([...watchlist, { id: docRef.id, ...watchlistItem }]);
      }
      return { success: true };
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return { success: false, error: error.message };
    }
  };

  const removeFromWatchlist = async (id) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      if (DEMO_MODE) {
        // Demo mode: Remove from localStorage
        const newWatchlist = watchlist.filter(item => item.id !== id);
        setWatchlist(newWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
      } else {
        // Production mode: Remove from Firebase
        await deleteDoc(doc(db, 'watchlists', id));
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

