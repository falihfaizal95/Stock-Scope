import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

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
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode: Auto-login with demo user
      setUser({
        uid: 'demo-user-123',
        email: 'demo@stockscope.app',
        emailVerified: true
      });
      setUserProfile({
        fullName: 'Demo User',
        birthday: '01/01/1990',
        occupation: 'Student',
        state: 'CA'
      });
      setLoading(false);
    } else {
      // Production mode: Use Firebase
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          // Fetch user profile from Firestore
          try {
            const profileDoc = await getDoc(doc(db, 'users', user.uid));
            if (profileDoc.exists()) {
              setUserProfile(profileDoc.data());
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        } else {
          setUserProfile(null);
        }
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

  const signUp = async (email, password, profileData = {}) => {
    if (DEMO_MODE) {
      // Demo mode: Accept any credentials
      setUser({
        uid: 'demo-user-123',
        email: email || 'demo@stockscope.app',
        emailVerified: true
      });
      setUserProfile(profileData);
      return { success: true };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user profile to Firestore
      if (userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          fullName: profileData.fullName || '',
          birthday: profileData.birthday || '',
          occupation: profileData.occupation || '',
          state: profileData.state || '',
          createdAt: new Date().toISOString(),
          profilePicture: null,
        });
        setUserProfile({
          fullName: profileData.fullName || '',
          birthday: profileData.birthday || '',
          occupation: profileData.occupation || '',
          state: profileData.state || '',
        });
      }
      
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

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      setUserProfile({ ...userProfile, ...updates });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

