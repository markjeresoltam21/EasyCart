import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from './AuthContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'carts', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCartItems(data.items || []);
        } else {
          setCartItems([]);
        }
      },
      (error) => {
        console.error('Error listening to cart changes:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveCartToFirestore = async (items) => {
    if (!user) return;
    
    try {
      await setDoc(doc(db, 'carts', user.uid), {
        items: items,
        userId: user.uid,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    setLoading(true);
    try {
      const newCartItems = [...cartItems];
      const existingItemIndex = newCartItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex > -1) {
        newCartItems[existingItemIndex].quantity += quantity;
      } else {
        newCartItems.push({ ...product, quantity });
      }
      
      await saveCartToFirestore(newCartItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user) return;
    
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    setLoading(true);
    try {
      const newCartItems = cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      await saveCartToFirestore(newCartItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const newCartItems = cartItems.filter(item => item.id !== productId);
      await saveCartToFirestore(newCartItems);
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await saveCartToFirestore([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemsCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
