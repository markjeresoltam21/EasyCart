import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { usePayment } from '../../context/PaymentContext';
import SweetAlert from '../../utils/SweetAlert';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { getEnabledPaymentMethods } = usePayment();
  
  const enabledPaymentMethods = getEnabledPaymentMethods();
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: enabledPaymentMethods[0]?.id || 'cod',
  });
  const [loading, setLoading] = useState(false);

  const getPaymentIcon = (iconType) => {
    switch (iconType) {
      case 'cash':
        return 'cash-outline';
      case 'mobile-alt':
        return 'phone-portrait-outline';
      case 'university':
        return 'business-outline';
      default:
        return 'card-outline';
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      SweetAlert.warning('Missing Information', 'Please fill in all required fields');
      return;
    }

    const selectedPaymentMethod = enabledPaymentMethods.find(method => method.id === customerInfo.paymentMethod);

    setLoading(true);
    try {
      const orderData = {
        items: cartItems,
        customerInfo,
        paymentMethod: selectedPaymentMethod,
        totalAmount: getCartTotal(),
        status: 'Pending',
        userId: user?.uid || 'guest',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      
      SweetAlert.success(
        '🎉 Order Placed!',
        `Your order has been placed successfully using ${selectedPaymentMethod?.name}. You will receive updates on your order status.`,
        () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'UserTabs', params: { screen: 'Orders' } }],
          });
        }
      );
    } catch (error) {
      SweetAlert.error('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} x ₱{item.price.toFixed(2)} = ₱{(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>₱{getCartTotal().toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={customerInfo.name}
            onChangeText={(text) => setCustomerInfo({...customerInfo, name: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={customerInfo.phone}
            onChangeText={(text) => setCustomerInfo({...customerInfo, phone: text})}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Delivery Address *"
            value={customerInfo.address}
            onChangeText={(text) => setCustomerInfo({...customerInfo, address: text})}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {enabledPaymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                customerInfo.paymentMethod === method.id && styles.selectedPaymentOption
              ]}
              onPress={() => setCustomerInfo({...customerInfo, paymentMethod: method.id})}
            >
              <View style={styles.paymentMethodContent}>
                <View style={styles.paymentMethodLeft}>
                  <Ionicons 
                    name={getPaymentIcon(method.icon)} 
                    size={24} 
                    color={customerInfo.paymentMethod === method.id ? '#2e78b7' : '#666'} 
                  />
                  <View style={styles.paymentMethodText}>
                    <Text style={[
                      styles.paymentText,
                      customerInfo.paymentMethod === method.id && styles.selectedPaymentText
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={styles.paymentSubtext}>{method.description}</Text>
                  </View>
                </View>
                {customerInfo.paymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#2e78b7" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderText}>
            {loading ? 'Placing Order...' : `Place Order - ₱${getCartTotal().toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
  },
  paymentOption: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2e78b7',
  },
  paymentOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedPaymentOption: {
    borderColor: '#2e78b7',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    marginLeft: 15,
    flex: 1,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  selectedPaymentText: {
    color: '#2e78b7',
  },
  paymentSubtext: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    backgroundColor: '#2e78b7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  placeOrderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;