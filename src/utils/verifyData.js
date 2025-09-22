import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const verifyDataState = async () => {
  console.log('=== Current Data State ===');
  
  try {
    // Check orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = [];
    const productReferences = new Set();
    
    ordersSnapshot.forEach((doc) => {
      const orderData = { id: doc.id, ...doc.data() };
      orders.push(orderData);
      
      // Extract product references
      const items = orderData.items || orderData.products || orderData.cartItems || [];
      if (Array.isArray(items)) {
        items.forEach(item => {
          let productId = null;
          if (typeof item === 'string') {
            productId = item;
          } else if (item && typeof item === 'object') {
            productId = item.productId || item.id || item.product_id || item.product?.id;
          }
          if (productId) {
            productReferences.add(productId);
          }
        });
      }
    });
    
    // Check products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = [];
    const existingProductIds = new Set();
    
    productsSnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() };
      products.push(productData);
      existingProductIds.add(doc.id);
    });
    
    // Check users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    // Find missing products
    const missingProductIds = [];
    productReferences.forEach(id => {
      if (!existingProductIds.has(id)) {
        missingProductIds.push(id);
      }
    });
    
    const report = {
      orders: {
        total: orders.length,
        sampleIds: orders.slice(0, 3).map(o => o.id)
      },
      products: {
        total: products.length,
        sampleNames: products.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
      },
      users: {
        total: users.length,
        sampleEmails: users.slice(0, 3).map(u => u.email || 'No email')
      },
      productReferences: {
        total: productReferences.size,
        existing: Array.from(existingProductIds),
        missing: missingProductIds,
        missingCount: missingProductIds.length
      }
    };
    
    console.log('\n📊 DATA REPORT:');
    console.log(`Orders: ${report.orders.total}`);
    console.log(`Products: ${report.products.total}`);
    console.log(`Users: ${report.users.total}`);
    console.log(`Missing Products: ${report.productReferences.missingCount}`);
    console.log('Missing Product IDs:', missingProductIds);
    
    return report;
    
  } catch (error) {
    console.error('Error verifying data state:', error);
    throw error;
  }
};