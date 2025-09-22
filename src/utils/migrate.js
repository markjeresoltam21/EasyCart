import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFdSYsZdip806_kDKGn0Cr55UFS1fTxHk",
  authDomain: "easycart-459d9.firebaseapp.com",
  projectId: "easycart-459d9",
  storageBucket: "easycart-459d9.firebasestorage.app",
  messagingSenderId: "58355458780",
  appId: "1:58355458780:android:bb84d2b60f3f07f2dd0a19"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initial data
const users = [
  { email: 'admin@easycart.com', password: 'admin123', role: 'admin' },
  { email: 'user@easycart.com', password: 'user123', role: 'customer' }
];

const products = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest Apple iPhone with advanced camera system and A17 Pro chip.',
    price: 999.99,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1592286062904-4c63c6e0a9a9?w=400',
    category: 'Electronics'
  },
  {
    name: 'Samsung Galaxy Watch',
    description: 'Advanced smartwatch with health monitoring and GPS.',
    price: 299.99,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5786dc1313?w=400',
    category: 'Electronics'
  },
  {
    name: 'Nike Air Max Sneakers',
    description: 'Comfortable running shoes with Air Max cushioning.',
    price: 129.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    category: 'Fashion'
  },
  {
    name: 'MacBook Pro 14"',
    description: 'Powerful laptop with M3 chip for professionals.',
    price: 1999.99,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
    category: 'Electronics'
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Premium noise-canceling wireless headphones.',
    price: 399.99,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics'
  },
  {
    name: 'Levi\'s Denim Jacket',
    description: 'Classic denim jacket made from premium cotton.',
    price: 89.99,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
    category: 'Fashion'
  }
];

export const migrateDatabase = async () => {
  console.log('🚀 Starting database migration...');

  // Create users
  console.log('Creating users...');
  for (const userData of users) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userData.email,
        role: userData.role,
        createdAt: new Date()
      });
      
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error) {
      console.log(`⚠️ ${userData.email} might already exist`);
    }
  }

  // Create products
  console.log('Creating products...');
  for (const product of products) {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created product: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error.message);
    }
  }

  console.log('🎉 Migration completed!');
};