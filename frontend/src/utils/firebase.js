import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDu6L0wSXxtxwSI18ImDnX-G8VXi4AWWv0",
  authDomain: "stockscope-e9036.firebaseapp.com",
  projectId: "stockscope-e9036",
  storageBucket: "stockscope-e9036.firebasestorage.app",
  messagingSenderId: "159281703881",
  appId: "1:159281703881:web:70055569fc27d340475618",
  measurementId: "G-19YTBS435N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

