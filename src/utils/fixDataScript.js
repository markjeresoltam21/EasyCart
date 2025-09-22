import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export const cleanupInvalidOrders = async () => {
  console.log('=== Cleaning Up Invalid Orders ===');
  
  try {
    // 1. Get all orders and products
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const productsSnapshot = await getDocs(collection(db, 'products'));
    
    const orders = [];
    const productIds = new Set();
    
    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    productsSnapshot.forEach((doc) => {
      productIds.add(doc.id);
    });
    
    console.log(`Found ${orders.length} orders and ${productIds.size} products`);
    console.log('Available product IDs:', Array.from(productIds));
    
    // 2. Identify orders with invalid product references
    const invalidOrders = [];
    const validOrders = [];
    
    for (const order of orders) {
      const items = order.items || order.products || order.cartItems || [];
      let hasInvalidProducts = false;
      
      if (Array.isArray(items)) {
        for (const item of items) {
          let productId = null;
          if (typeof item === 'string') {
            productId = item;
          } else if (item && typeof item === 'object') {
            productId = item.productId || item.id || item.product_id || item.product?.id;
          }
          
          if (productId && !productIds.has(productId)) {
            hasInvalidProducts = true;
            break;
          }
        }
      }
      
      if (hasInvalidProducts) {
        invalidOrders.push(order);
      } else {
        validOrders.push(order);
      }
    }
    
    console.log(`Found ${invalidOrders.length} invalid orders and ${validOrders.length} valid orders`);
    
    // 3. Remove invalid orders
    if (invalidOrders.length > 0) {
      console.log('\n=== Removing Invalid Orders ===');
      const batch = writeBatch(db);
      
      for (const order of invalidOrders) {
        console.log(`Removing order ${order.id} - has invalid product references`);
        batch.delete(doc(db, 'orders', order.id));
      }
      
      await batch.commit();
      console.log(`✅ Removed ${invalidOrders.length} invalid orders`);
    }
    
    return {
      totalOrders: orders.length,
      validOrders: validOrders.length,
      invalidOrdersRemoved: invalidOrders.length,
      invalidOrders: invalidOrders.map(o => ({ id: o.id, customerName: o.customerInfo?.name || 'Unknown' }))
    };
    
  } catch (error) {
    console.error('Error cleaning up orders:', error);
    throw error;
  }
};

export const migrateOrdersToProducts = async () => {
  console.log('=== Migrating Orders to Match Products ===');
  
  try {
    // 1. Get all products first
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${products.length} products to work with`);
    
    // 2. Get all orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = [];
    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${orders.length} orders to migrate`);
    
    // 3. For each order, try to match products by name similarity or create missing ones
    const migratedOrders = [];
    const createdProducts = [];
    
    for (const order of orders) {
      const items = order.items || order.products || order.cartItems || [];
      let needsUpdate = false;
      const updatedItems = [];
      
      if (Array.isArray(items)) {
        for (const item of items) {
          let productId = null;
          let productName = null;
          
          if (typeof item === 'string') {
            productId = item;
          } else if (item && typeof item === 'object') {
            productId = item.productId || item.id || item.product_id || item.product?.id;
            productName = item.name || item.productName;
          }
          
          // Check if product exists
          const existingProduct = products.find(p => p.id === productId);
          
          if (!existingProduct && productId) {
            // Create missing product
            const newProductData = {
              name: productName || `Product ${productId.replace(/[^a-zA-Z0-9]/g, ' ').trim()}`,
              description: `Migrated product from order ${order.id}`,
              price: item.price || 999.99,
              category: 'General',
              image: 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Product',
              stock: 50,
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            console.log(`Creating product ${productId}:`, newProductData.name);
            await setDoc(doc(db, 'products', productId), newProductData);
            
            products.push({ id: productId, ...newProductData });
            createdProducts.push({ id: productId, name: newProductData.name });
          }
          
          // Ensure item has proper structure
          const updatedItem = {
            productId: productId,
            quantity: item.quantity || 1,
            price: item.price || 0,
            ...item
          };
          
          updatedItems.push(updatedItem);
        }
        
        // Update order with properly structured items
        if (JSON.stringify(items) !== JSON.stringify(updatedItems)) {
          needsUpdate = true;
          await setDoc(doc(db, 'orders', order.id), {
            ...order,
            items: updatedItems
          });
          
          migratedOrders.push(order.id);
        }
      }
    }
    
    console.log(`✅ Migrated ${migratedOrders.length} orders`);
    console.log(`✅ Created ${createdProducts.length} missing products`);
    
    return {
      migratedOrders: migratedOrders.length,
      createdProducts: createdProducts.length,
      newProducts: createdProducts
    };
    
  } catch (error) {
    console.error('Error migrating orders:', error);
    throw error;
  }
};

export const calculateUserStats = async () => {
  console.log('\n=== Calculating User Stats ===');
  
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    // Get all orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const userStats = {};
    
    // Initialize stats for all users
    users.forEach(user => {
      userStats[user.id] = {
        email: user.email,
        name: user.name || user.displayName || 'Unknown User',
        orderCount: 0,
        totalSpent: 0,
        orders: []
      };
    });
    
    // Calculate stats from orders
    ordersSnapshot.forEach((doc) => {
      const order = doc.data();
      const userId = order.userId || order.customerId || order.user?.id;
      
      if (userId && userStats[userId]) {
        userStats[userId].orderCount++;
        userStats[userId].totalSpent += order.totalAmount || order.total || 0;
        userStats[userId].orders.push({
          id: doc.id,
          total: order.totalAmount || order.total || 0,
          status: order.status,
          date: order.createdAt || order.orderDate
        });
      }
    });
    
    console.log('User stats:', userStats);
    return userStats;
    
  } catch (error) {
    console.error('Error calculating user stats:', error);
    throw error;
  }
};