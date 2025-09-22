import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from './AuthContext';

const OrderContext = createContext({});

export const OrderProvider = ({ children }) => {
  const [userOrders, setUserOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // For admin
  const [loading, setLoading] = useState(false);
  const { user, userRole } = useAuth();

  // Listen to user's orders
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }

    const userOrdersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      userOrdersQuery,
      (querySnapshot) => {
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        // Sort by createdAt in the client to avoid index requirement
        orders.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()));
        setUserOrders(orders);
      },
      (error) => {
        console.error('Error listening to user orders:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to all orders (for admin)
  useEffect(() => {
    if (userRole !== 'admin') {
      setAllOrders([]);
      return;
    }

    const allOrdersQuery = collection(db, 'orders');

    const unsubscribe = onSnapshot(
      allOrdersQuery,
      (querySnapshot) => {
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        // Sort by createdAt in the client to avoid index requirement
        orders.sort((a, b) => (b.createdAt || new Date()) - (a.createdAt || new Date()));
        setAllOrders(orders);
      },
      (error) => {
        console.error('Error listening to all orders:', error);
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  const updateOrderStatus = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByStatus = (status, isAdmin = false) => {
    const orders = isAdmin ? allOrders : userOrders;
    return orders.filter(order => order.status === status);
  };

  const getOrderStats = () => {
    if (userRole !== 'admin') return null;

    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'Pending').length,
      processing: allOrders.filter(o => o.status === 'Processing').length,
      shipped: allOrders.filter(o => o.status === 'Shipped').length,
      delivered: allOrders.filter(o => o.status === 'Delivered').length,
      cancelled: allOrders.filter(o => o.status === 'Cancelled').length,
      totalRevenue: allOrders
        .filter(o => o.status === 'Delivered')
        .reduce((total, order) => total + (order.totalAmount || 0), 0),
    };

    return stats;
  };

  return (
    <OrderContext.Provider value={{
      userOrders,
      allOrders,
      loading,
      updateOrderStatus,
      getOrdersByStatus,
      getOrderStats,
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};