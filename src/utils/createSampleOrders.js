import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const createSampleOrders = async () => {
  try {
    // Get some existing products
    const productsQuery = query(collection(db, 'products'), limit(5));
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.empty) {
      console.log('No products found to create orders with');
      return;
    }
    
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Available products:', products);
    
    // Create sample orders matching your Firestore structure
    const sampleOrders = [
      {
        customerInfo: {
          name: 'John Doe',
          address: 'Manila City, Philippines',
          phone: '+639123456789'
        },
        status: 'pending',
        totalAmount: 1999.98,
        items: [
          {
            id: products[0]?.id,  // Using 'id' field as in your Firestore
            name: products[0]?.name,
            quantity: 1,
            price: products[0]?.price || 999.99,
            imageUrl: products[0]?.image
          },
          {
            id: products[1]?.id,
            name: products[1]?.name,
            quantity: 1,
            price: products[1]?.price || 999.99,
            imageUrl: products[1]?.image
          }
        ],
        paymentMethod: 'Cash on Delivery',
        createdAt: new Date(),
        userId: 'sample-user-1'
      },
      {
        customerInfo: {
          name: 'Jane Smith',
          address: 'Cebu City, Philippines', 
          phone: '+639987654321'
        },
        status: 'Confirmed',  // Using 'Confirmed' as in your Firestore
        totalAmount: 1499.99,
        items: [
          {
            id: products[2]?.id,
            name: products[2]?.name,
            quantity: 2,
            price: products[2]?.price || 749.99,
            imageUrl: products[2]?.image
          }
        ],
        paymentMethod: 'GCash',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        userId: 'sample-user-2'
      },
      {
        customerInfo: {
          name: 'Mike Johnson',
          address: 'Davao City, Philippines',
          phone: '+639111222333'
        },
        status: 'pending',
        totalAmount: 2999.97,
        items: [
          {
            id: products[3]?.id,
            name: products[3]?.name,
            quantity: 3,
            price: products[3]?.price || 999.99,
            imageUrl: products[3]?.image
          }
        ],
        paymentMethod: 'Bank Transfer',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        userId: 'sample-user-3'
      }
    ];
    
    // Add orders to Firestore
    for (const order of sampleOrders) {
      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log('Created order with ID:', docRef.id);
    }
    
    console.log('Sample orders created successfully!');
    return sampleOrders.length;
    
  } catch (error) {
    console.error('Error creating sample orders:', error);
    throw error;
  }
};