import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Network status tracking
let isOffline = false;

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
};

// Utility function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced error handling wrapper
const withRetry = async (operation, retries = RETRY_CONFIG.maxRetries, delay = RETRY_CONFIG.retryDelay) => {
  try {
    return await operation();
  } catch (error) {
    console.log(`Operation failed, retries left: ${retries}`, error.message);
    
    // Check if it's a network error
    if (error.code === 'unavailable' || error.message.includes('offline') || error.message.includes('network')) {
      isOffline = true;
      
      if (retries > 0) {
        console.log(`Retrying operation in ${delay}ms...`);
        await wait(delay);
        return withRetry(operation, retries - 1, delay * RETRY_CONFIG.backoffMultiplier);
      }
    }
    
    // If it's not a network error or we've exhausted retries, throw the error
    throw error;
  }
};

// Enhanced Firestore operations
export const firestoreOperations = {
  // Get document with retry
  getDocument: async (collectionName, docId) => {
    return withRetry(async () => {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        isOffline = false; // Reset offline status on success
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    });
  },

  // Set document with retry
  setDocument: async (collectionName, docId, data) => {
    return withRetry(async () => {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
      isOffline = false;
      return true;
    });
  },

  // Update document with retry
  updateDocument: async (collectionName, docId, data) => {
    return withRetry(async () => {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
      isOffline = false;
      return true;
    });
  },

  // Delete document with retry
  deleteDocument: async (collectionName, docId) => {
    return withRetry(async () => {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      isOffline = false;
      return true;
    });
  },

  // Get collection with retry
  getCollection: async (collectionName, queryConstraints = []) => {
    return withRetry(async () => {
      let collectionRef = collection(db, collectionName);
      
      if (queryConstraints.length > 0) {
        collectionRef = query(collectionRef, ...queryConstraints);
      }
      
      const querySnapshot = await getDocs(collectionRef);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      isOffline = false;
      return documents;
    });
  },

  // Add document with retry
  addDocument: async (collectionName, data) => {
    return withRetry(async () => {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      isOffline = false;
      return docRef.id;
    });
  }
};

// Connection status
export const getConnectionStatus = () => ({
  isOffline,
  isOnline: !isOffline
});

// Manual connection test
export const testConnection = async () => {
  try {
    // Try to get a small document or create a test document
    const testRef = doc(db, '_test', 'connection');
    await getDoc(testRef);
    isOffline = false;
    return true;
  } catch (error) {
    isOffline = true;
    console.log('Connection test failed:', error.message);
    return false;
  }
};

export default firestoreOperations;