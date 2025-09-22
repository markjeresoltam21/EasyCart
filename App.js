import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { PaymentProvider } from './src/context/PaymentContext';
import { OrderProvider } from './src/context/OrderContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OrderProvider>
          <PaymentProvider>
            <CartProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </CartProvider>
          </PaymentProvider>
        </OrderProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
