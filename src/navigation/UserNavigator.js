import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { View, Text } from 'react-native';

// User Screens
import ProductsScreen from '../screens/user/ProductsScreen';
import ProductDetailScreen from '../screens/user/ProductDetailScreen';
import CartScreen from '../screens/user/CartScreen';
import CheckoutScreen from '../screens/user/CheckoutScreen';
import OrderHistoryScreen from '../screens/user/OrderHistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import SettingsScreen from '../screens/user/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CartIcon = ({ color, size }) => {
  const { getCartItemsCount } = useCart();
  const count = getCartItemsCount();

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name="cart" size={size} color={color} />
      {count > 0 && (
        <View style={{
          position: 'absolute',
          right: -6,
          top: -3,
          backgroundColor: 'red',
          borderRadius: 10,
          width: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </View>
  );
};

const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Products') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Cart') {
            return <CartIcon color={color} size={size} />;
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2e78b7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ headerShown: false }} 
      />
      <Tab.Screen 
        name="Orders" 
        component={OrderHistoryScreen} 
        options={{ headerShown: false }} 
      />
    </Tab.Navigator>
  );
};

const UserNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserTabs" 
        component={UserTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={{ title: 'Product Details' }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default UserNavigator;