import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const PaymentContext = createContext({});

// Default payment methods available
const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    icon: 'cash',
    enabled: true,
    description: 'Pay when you receive your order'
  },
  {
    id: 'gcash',
    name: 'GCash',
    type: 'digital_wallet',
    icon: 'mobile-alt',
    enabled: true,
    description: 'Pay using GCash mobile wallet'
  },
  {
    id: 'paymaya',
    name: 'PayMaya',
    type: 'digital_wallet', 
    icon: 'mobile-alt',
    enabled: true,
    description: 'Pay using PayMaya digital wallet'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'digital_wallet',
    icon: 'mobile-alt',
    enabled: true,
    description: 'Pay using PayPal digital wallet'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    type: 'bank',
    icon: 'university',
    enabled: true,
    description: 'Transfer directly to bank account'
  }
];

export const PaymentProvider = ({ children }) => {
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [loading, setLoading] = useState(false);

  // Listen to payment method changes in Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'payment_methods'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          let methods = data.methods || DEFAULT_PAYMENT_METHODS;
          
          // Check if PayPal exists, if not add it
          const hasPayPal = methods.some(method => method.id === 'paypal');
          if (!hasPayPal) {
            const paypalMethod = DEFAULT_PAYMENT_METHODS.find(method => method.id === 'paypal');
            if (paypalMethod) {
              methods = [...methods, paypalMethod];
              // Update Firestore with PayPal included
              setDoc(doc(db, 'settings', 'payment_methods'), {
                methods: methods,
                updatedAt: new Date(),
              }).catch(console.error);
            }
          }
          
          setPaymentMethods(methods);
        } else {
          // Initialize with default payment methods if document doesn't exist
          initializePaymentMethods();
        }
      },
      (error) => {
        console.error('Error listening to payment method changes:', error);
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      }
    );

    return () => unsubscribe();
  }, []);

  const initializePaymentMethods = async () => {
    try {
      await setDoc(doc(db, 'settings', 'payment_methods'), {
        methods: DEFAULT_PAYMENT_METHODS,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error initializing payment methods:', error);
    }
  };

  const updatePaymentMethod = async (methodId, updates) => {
    setLoading(true);
    try {
      const updatedMethods = paymentMethods.map(method =>
        method.id === methodId ? { ...method, ...updates } : method
      );

      await setDoc(doc(db, 'settings', 'payment_methods'), {
        methods: updatedMethods,
        updatedAt: new Date(),
      });

      setPaymentMethods(updatedMethods);
    } catch (error) {
      console.error('Error updating payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method) {
      await updatePaymentMethod(methodId, { enabled: !method.enabled });
    }
  };

  const getEnabledPaymentMethods = () => {
    return paymentMethods.filter(method => method.enabled);
  };

  const getPaymentMethodsByProduct = (productId) => {
    // This would be expanded to filter by product-specific payment methods
    // For now, return all enabled methods
    return getEnabledPaymentMethods();
  };

  const assignPaymentMethodsToProduct = async (productId, methodIds) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'product_payment_methods', productId), {
        productId,
        paymentMethods: methodIds,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error assigning payment methods to product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentContext.Provider value={{
      paymentMethods,
      loading,
      updatePaymentMethod,
      togglePaymentMethod,
      getEnabledPaymentMethods,
      getPaymentMethodsByProduct,
      assignPaymentMethodsToProduct,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};