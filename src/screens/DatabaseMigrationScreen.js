import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

const DatabaseMigrationScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationLog, setMigrationLog] = useState([]);

  const addLog = (message) => {
    setMigrationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const users = [
    { email: 'markjeresoltam@gmail.com', password: 'admin123', role: 'admin', name: 'Mark Jere Soltam Gementiza' },
    { email: 'kim.duites@easycart.com', password: 'user123', role: 'customer', name: 'Kim Duites' },
    { email: 'rolly.junsay@easycart.com', password: 'user123', role: 'customer', name: 'Rolly Junsay' },
    { email: 'ria.balana@easycart.com', password: 'user123', role: 'customer', name: 'Ria Angeline Balana' },
    { email: 'julie.banayag@easycart.com', password: 'user123', role: 'customer', name: 'Julie Banayag' }
  ];

  const products = [
    {
      name: 'iPhone 15 Pro',
      description: 'Latest Apple iPhone with advanced camera system and A17 Pro chip. Perfect for photography and gaming.',
      price: 999.99,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1592286062904-4c63c6e0a9a9?w=400',
      category: 'Electronics'
    },
    {
      name: 'Samsung Galaxy Watch',
      description: 'Advanced smartwatch with health monitoring, GPS, and long battery life.',
      price: 299.99,
      stock: 15,
      imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5786dc1313?w=400',
      category: 'Electronics'
    },
    {
      name: 'Nike Air Max Sneakers',
      description: 'Comfortable running shoes with Air Max cushioning technology.',
      price: 129.99,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      category: 'Fashion'
    },
    {
      name: 'MacBook Pro 14"',
      description: 'Powerful laptop with M3 chip, perfect for developers and creative professionals.',
      price: 1999.99,
      stock: 10,
      imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
      category: 'Electronics'
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Premium noise-canceling wireless headphones with superior sound quality.',
      price: 399.99,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'Electronics'
    },
    {
      name: 'Levi\'s Denim Jacket',
      description: 'Classic denim jacket made from premium cotton. Timeless style for any occasion.',
      price: 89.99,
      stock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
      category: 'Fashion'
    }
  ];

  const createUsers = async () => {
    addLog('Creating users...');
    let successCount = 0;
    
    for (const userData of users) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userData.email,
          role: userData.role,
          displayName: userData.name,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        addLog(`✅ Created user: ${userData.email}`);
        successCount++;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          addLog(`⚠️ User ${userData.email} already exists`);
        } else {
          addLog(`❌ Error creating ${userData.email}: ${error.message}`);
        }
      }
    }
    
    addLog(`Users created: ${successCount}/${users.length}`);
  };

  const createProducts = async () => {
    addLog('Creating products...');
    let successCount = 0;
    
    for (const product of products) {
      try {
        const docRef = await addDoc(collection(db, 'products'), {
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        addLog(`✅ Created product: ${product.name}`);
        successCount++;
      } catch (error) {
        addLog(`❌ Error creating ${product.name}: ${error.message}`);
      }
    }
    
    addLog(`Products created: ${successCount}/${products.length}`);
  };

  const createSampleOrders = async () => {
    addLog('Creating sample orders...');
    
    const sampleOrders = [
      {
        userId: 'kim-duites-user-id',
        items: [
          {
            id: 'demo-product-1',
            name: 'iPhone 15 Pro',
            price: 999.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1592286062904-4c63c6e0a9a9?w=400'
          }
        ],
        customerInfo: {
          name: 'Kim Duites',
          phone: '+639123456789',
          address: 'Cebu City, Philippines',
          paymentMethod: 'Cash on Delivery'
        },
        totalAmount: 999.99,
        status: 'Pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 'rolly-junsay-user-id',
        items: [
          {
            id: 'demo-product-2',
            name: 'Samsung Galaxy Watch',
            price: 299.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1551816230-ef5786dc1313?w=400'
          },
          {
            id: 'demo-product-3',
            name: 'Nike Air Max Sneakers',
            price: 129.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
          }
        ],
        customerInfo: {
          name: 'Rolly Junsay',
          phone: '+639987654321',
          address: 'Mandaue City, Philippines',
          paymentMethod: 'Cash on Delivery'
        },
        totalAmount: 429.98,
        status: 'Confirmed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        userId: 'ria-balana-user-id',
        items: [
          {
            id: 'demo-product-4',
            name: 'MacBook Pro 14"',
            price: 1999.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'
          }
        ],
        customerInfo: {
          name: 'Ria Angeline Balana',
          phone: '+639456789123',
          address: 'Lapu-Lapu City, Philippines',
          paymentMethod: 'Cash on Delivery'
        },
        totalAmount: 1999.99,
        status: 'Completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'julie-banayag-user-id',
        items: [
          {
            id: 'demo-product-5',
            name: 'Sony WH-1000XM5 Headphones',
            price: 399.99,
            quantity: 1,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
          },
          {
            id: 'demo-product-6',
            name: 'Levi\'s Denim Jacket',
            price: 89.99,
            quantity: 2,
            imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400'
          }
        ],
        customerInfo: {
          name: 'Julie Banayag',
          phone: '+639789123456',
          address: 'Talisay City, Philippines',
          paymentMethod: 'Cash on Delivery'
        },
        totalAmount: 579.97,
        status: 'Pending',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    let successCount = 0;
    for (const order of sampleOrders) {
      try {
        await addDoc(collection(db, 'orders'), order);
        addLog(`✅ Created sample order for ${order.customerInfo.name}`);
        successCount++;
      } catch (error) {
        addLog(`❌ Error creating order for ${order.customerInfo.name}: ${error.message}`);
      }
    }
    
    addLog(`Sample orders created: ${successCount}/${sampleOrders.length}`);
  };

  const runFullMigration = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMigrationLog([]);
    
    try {
      addLog('🚀 Starting EasyCart Database Migration...');
      
      await createUsers();
      await createProducts();
      await createSampleOrders();
      
      addLog('🎉 Migration completed successfully!');
      addLog('Your database is now ready to use.');
      
      Alert.alert(
        'Migration Complete!',
        'Your EasyCart database has been initialized with demo users, products, and orders.',
        [
          {
            text: 'Go to App',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      addLog(`❌ Migration failed: ${error.message}`);
      Alert.alert('Migration Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Migration</Text>
        <Text style={styles.subtitle}>Initialize your EasyCart database</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runFullMigration}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Migrating...' : 'Run Full Migration'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to App</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>This will create:</Text>
        <Text style={styles.infoText}>👤 5 Users (1 admin + 4 customers)</Text>
        <Text style={styles.infoText}>📦 6 Sample Products</Text>
        <Text style={styles.infoText}>📋 4 Sample Orders</Text>
        <Text style={styles.infoText}>🏠 Philippines addresses</Text>
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Migration Log:</Text>
        {migrationLog.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e78b7',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2e78b7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  logContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxHeight: 300,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default DatabaseMigrationScreen;