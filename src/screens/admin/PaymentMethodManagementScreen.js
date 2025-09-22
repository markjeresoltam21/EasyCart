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

const PaymentMethodManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [paymentMethods, setPaymentMethods] = useState({
    cod: {
      enabled: true,
      name: 'Cash on Delivery',
      description: 'Pay when you receive your order',
      icon: 'cash-outline',
      color: '#27ae60'
    },
    gcash: {
      enabled: false,
      name: 'GCash',
      description: 'Pay using GCash mobile wallet',
      icon: 'phone-portrait-outline',
      color: '#007DFF',
      accountNumber: '',
      accountName: ''
    },
    paymaya: {
      enabled: false,
      name: 'PayMaya',
      description: 'Pay using PayMaya digital wallet',
      icon: 'card-outline',
      color: '#00D632',
      accountNumber: '',
      accountName: ''
    },
    bankTransfer: {
      enabled: false,
      name: 'Bank Transfer',
      description: 'Transfer directly to bank account',
      icon: 'business-outline',
      color: '#e74c3c',
      bankName: '',
      accountNumber: '',
      accountName: ''
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
      Alert.alert('Error', 'Please enter account/mobile number');
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
              <Ionicons name={method.icon} size={24} color="white" />
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
            trackColor={{ false: theme.colors.border, true: method.color }}
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
                      style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                      placeholder="e.g., BPI, BDO, Metrobank"
                      placeholderTextColor={theme.colors.textMuted}
                      value={tempBankName}
                      onChangeText={setTempBankName}
                    />
                  </View>
                )}

                {/* Account/Mobile Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    {methodKey === 'bankTransfer' ? 'Account Number' : 'Mobile Number'}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder={methodKey === 'bankTransfer' ? '1234567890' : '09XXXXXXXXX'}
                    placeholderTextColor={theme.colors.textMuted}
                    value={tempAccountNumber}
                    onChangeText={setTempAccountNumber}
                    keyboardType={methodKey === 'bankTransfer' ? 'numeric' : 'phone-pad'}
                  />
                </View>

                {/* Account Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="Juan Dela Cruz"
                    placeholderTextColor={theme.colors.textMuted}
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
        <Text style={styles.title}>Payment Methods</Text>
        <Text style={styles.subtitle}>Configure available payment options for customers</Text>
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
            <Ionicons name="information-circle-outline" size={24} color="#3498db" />
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 14,
    color: '#666',
  },
  configuredText: {
    fontSize: 12,
    color: '#27ae60',
    marginTop: 2,
    fontWeight: '600',
  },
  configSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  configButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  configForm: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default PaymentMethodManagementScreen;