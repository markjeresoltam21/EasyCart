import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const AdminPaymentMethodsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  // Custom logo renderer for payment methods
  const renderPaymentIcon = (methodKey, method) => {
    switch (methodKey) {
      case 'gcash':
        return (
          <Text style={styles.brandLogo}>GCash</Text>
        );
      case 'paymaya':
        return (
          <Text style={styles.brandLogo}>Maya</Text>
        );
      case 'paypal':
        return (
          <Text style={styles.paypalBrandLogo}>PayPal</Text>
        );
      case 'bankTransfer':
        return (
          <View style={styles.bankLogoContainer}>
            <Ionicons name="business" size={16} color="white" />
            <Text style={styles.bankLogoText}>Bank</Text>
          </View>
        );
      default:
        return (
          <Ionicons name={method.icon} size={24} color="white" />
        );
    }
  };

  const [paymentMethods, setPaymentMethods] = useState({
    cod: {
      enabled: true,
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: 'cash-outline',
      color: '#059669',
      useIcon: true
    },
    gcash: {
      enabled: false,
      name: 'GCash',
      description: 'Pay using GCash mobile wallet',
      icon: 'phone-portrait',
      color: '#007cff',
      accountNumber: '',
      accountName: '',
      useIcon: true
    },
    paymaya: {
      enabled: false,
      name: 'PayMaya',
      description: 'Pay using PayMaya digital wallet',
      icon: 'card',
      color: '#00d4aa',
      accountNumber: '',
      accountName: '',
      useIcon: true
    },
    paypal: {
      enabled: false,
      name: 'PayPal',
      description: 'Pay using PayPal account',
      icon: 'logo-paypal',
      color: '#0070ba',
      accountEmail: '',
      accountName: '',
      useIcon: true
    },
    bankTransfer: {
      enabled: false,
      name: 'Bank Transfer',
      description: 'Transfer directly to bank account',
      icon: 'business',
      color: '#dc2626',
      bankName: '',
      accountNumber: '',
      accountName: '',
      useIcon: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState(null);
  const [tempAccountNumber, setTempAccountNumber] = useState('');
  const [tempAccountName, setTempAccountName] = useState('');
  const [tempBankName, setTempBankName] = useState('');

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'paymentMethods');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const savedSettings = docSnap.data();
        setPaymentMethods(prev => ({
          ...prev,
          ...savedSettings
        }));
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      Alert.alert('Error', 'Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodKey) => {
    const newSettings = {
      ...paymentMethods,
      [methodKey]: {
        ...paymentMethods[methodKey],
        enabled: !paymentMethods[methodKey].enabled
      }
    };

    // If disabling and it's the last enabled method, prevent it
    const enabledMethods = Object.values(newSettings).filter(method => method.enabled);
    if (enabledMethods.length === 0) {
      Alert.alert(
        'Warning',
        'You must have at least one payment method enabled.'
      );
      return;
    }

    setPaymentMethods(newSettings);
    
    try {
      const docRef = doc(db, 'settings', 'paymentMethods');
      await setDoc(docRef, newSettings);
    } catch (error) {
      console.error('Error updating payment method:', error);
      Alert.alert('Error', 'Failed to update payment method');
    }
  };

  const startEditing = (methodKey) => {
    const method = paymentMethods[methodKey];
    setEditingMethod(methodKey);
    setTempAccountNumber(method.accountNumber || '');
    setTempAccountName(method.accountName || '');
    setTempBankName(method.bankName || '');
  };

  const saveConfiguration = async () => {
    if (!editingMethod) return;

    // Validation
    if (!tempAccountNumber.trim()) {
      const fieldName = editingMethod === 'paypal' ? 'PayPal email' : 
                       editingMethod === 'bankTransfer' ? 'account number' : 'mobile number';
      Alert.alert('Error', `Please enter ${fieldName}`);
      return;
    }
    if (!tempAccountName.trim()) {
      Alert.alert('Error', 'Please enter account name');
      return;
    }
    if (editingMethod === 'bankTransfer' && !tempBankName.trim()) {
      Alert.alert('Error', 'Please enter bank name');
      return;
    }

    const updatedMethods = {
      ...paymentMethods,
      [editingMethod]: {
        ...paymentMethods[editingMethod],
        accountNumber: tempAccountNumber.trim(),
        accountName: tempAccountName.trim(),
        ...(editingMethod === 'bankTransfer' && { bankName: tempBankName.trim() })
      }
    };

    setPaymentMethods(updatedMethods);

    try {
      const docRef = doc(db, 'settings', 'paymentMethods');
      await setDoc(docRef, updatedMethods);
      Alert.alert('Success', 'Configuration saved successfully');
      cancelEditing();
    } catch (error) {
      console.error('Error saving configuration:', error);
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const cancelEditing = () => {
    setEditingMethod(null);
    setTempAccountNumber('');
    setTempAccountName('');
    setTempBankName('');
  };

  const PaymentMethodCard = ({ methodKey, method }) => {
    const isEditing = editingMethod === methodKey;
    const hasConfiguration = method.accountNumber && method.accountName && 
                            (methodKey !== 'bankTransfer' || method.bankName);

    return (
      <View style={[styles.methodCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodInfo}>
            <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
              {renderPaymentIcon(methodKey, method)}
            </View>
            <View style={styles.methodDetails}>
              <Text style={[styles.methodName, { color: theme.colors.text }]}>{method.name}</Text>
              <Text style={[styles.methodDesc, { color: theme.colors.textSecondary }]}>{method.description}</Text>
              {hasConfiguration && (
                <Text style={[styles.configuredText, { color: theme.colors.success }]}>✓ Configured</Text>
              )}
            </View>
          </View>
          <Switch
            value={method.enabled}
            onValueChange={() => togglePaymentMethod(methodKey)}
            trackColor={{ false: theme.colors.border, true: method.color + '40' }}
            thumbColor={method.enabled ? method.color : theme.colors.textMuted}
            ios_backgroundColor={theme.colors.border}
            style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
          />
        </View>

        {/* Configuration Section */}
        {(methodKey !== 'cod') && (
          <View style={styles.configSection}>
            {!isEditing ? (
              <TouchableOpacity
                style={[styles.configButton, { borderColor: method.color }]}
                onPress={() => startEditing(methodKey)}
              >
                <Ionicons 
                  name={hasConfiguration ? "create-outline" : "add-outline"} 
                  size={20} 
                  color={method.color} 
                />
                <Text style={[styles.configButtonText, { color: method.color }]}>
                  {hasConfiguration ? 'Edit Configuration' : 'Configure Payment Details'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.configForm}>
                <Text style={styles.formTitle}>Configure {method.name}</Text>
                
                {/* Bank Name (for Bank Transfer only) */}
                {methodKey === 'bankTransfer' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bank Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., BPI, BDO, Metrobank"
                      placeholderTextColor="#9ca3af"
                      value={tempBankName}
                      onChangeText={setTempBankName}
                    />
                  </View>
                )}

                {/* Account/Mobile Number/Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {methodKey === 'bankTransfer' ? 'Account Number' : 
                     methodKey === 'paypal' ? 'PayPal Email' : 'Mobile Number'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      methodKey === 'bankTransfer' ? '1234567890' : 
                      methodKey === 'paypal' ? 'email@example.com' : '09XXXXXXXXX'
                    }
                    placeholderTextColor="#9ca3af"
                    value={tempAccountNumber}
                    onChangeText={setTempAccountNumber}
                    keyboardType={
                      methodKey === 'paypal' ? 'email-address' : 
                      methodKey === 'bankTransfer' ? 'numeric' : 'phone-pad'
                    }
                  />
                </View>

                {/* Account Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Juan Dela Cruz"
                    placeholderTextColor="#9ca3af"
                    value={tempAccountName}
                    onChangeText={setTempAccountName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={cancelEditing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: method.color }]}
                    onPress={saveConfiguration}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(paymentMethods).map(([key, method]) => (
          <PaymentMethodCard
            key={key}
            methodKey={key}
            method={method}
          />
        ))}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle-outline" size={26} color="#0ea5e9" />
            </View>
            <Text style={styles.infoTitle}>Payment Method Guidelines</Text>
          </View>
          <Text style={styles.infoText}>
            • At least one payment method must be enabled{'\n'}
            • Cash on Delivery is recommended for local deliveries{'\n'}
            • Digital wallets require valid account details{'\n'}
            • Customers will see the configured account numbers during checkout{'\n'}
            • Make sure account details are accurate before enabling
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2e78b7',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 55,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  methodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paypalBrandLogo: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  bankLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankLogoText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  methodDesc: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 20,
  },
  configuredText: {
    fontSize: 13,
    color: '#10b981',
    marginTop: 6,
    fontWeight: '700',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  configSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafbfc',
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 0,
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginHorizontal: 1,
    marginBottom: 1,
  },
  configButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    letterSpacing: -0.2,
  },
  configForm: {
    padding: 24,
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#1a202c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    letterSpacing: -0.3,
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '500',
  },
});

export default AdminPaymentMethodsScreen;