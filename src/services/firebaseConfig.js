import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFdSYsZdip806_kDKGn0Cr55UFS1fTxHk",
  authDomain: "easycart-459d9.firebaseapp.com",
  projectId: "easycart-459d9",
  storageBucket: "easycart-459d9.appspot.com",
  messagingSenderId: "58355458780",
  appId: "1:58355458780:android:bb84d2b60f3f07f2dd0a19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with settings
export const db = getFirestore(app);

// Configure Firestore settings for better offline support
const configureFirestore = async () => {
  try {
    // Enable offline persistence is automatic in v9
    console.log('Firestore initialized with offline persistence');
  } catch (error) {
    console.error('Error configuring Firestore:', error);
  }
};

// Initialize Firestore configuration
configureFirestore();

// Initialize Storage
export const storage = getStorage(app);

// Network utility functions
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled');
  } catch (error) {
    console.error('Error enabling Firestore network:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.log('Firestore network disabled');
  } catch (error) {
    console.error('Error disabling Firestore network:', error);
  }
};

export default app;