import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../utils/firebase';

// 🚀 DEMO MODE: Set to true to bypass Firebase authentication
const DEMO_MODE = false;

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode: Auto-login with demo user
      setUser({
        uid: 'demo-user-123',
        email: 'demo@stockscope.app',
        emailVerified: true
      });
      setLoading(false);
    } else {
      // Production mode: Use Firebase
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  const signIn = async (email, password) => {
    if (DEMO_MODE) {
      // Demo mode: Accept any credentials
      setUser({
        uid: 'demo-user-123',
        email: email || 'demo@stockscope.app',
        emailVerified: true
      });
      return { success: true };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password) => {
    if (DEMO_MODE) {
      // Demo mode: Accept any credentials
      setUser({
        uid: 'demo-user-123',
        email: email || 'demo@stockscope.app',
        emailVerified: true
      });
      return { success: true };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    if (DEMO_MODE) {
      // Demo mode: Just clear the user
      setUser(null);
      return { success: true };
    }

    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

