import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { testConnection, getConnectionStatus } from '../services/firestoreUtils';

const ConnectionTest = () => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ isOnline: true });

  useEffect(() => {
    // Update connection status periodically
    const interval = setInterval(() => {
      setConnectionStatus(getConnectionStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      const isConnected = await testConnection();
      
      Alert.alert(
        'Connection Test',
        isConnected 
          ? '✅ Firebase connection is working!' 
          : '❌ Firebase connection failed. Please check your internet connection.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Connection Test',
        `❌ Connection test failed: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Ionicons 
          name={connectionStatus.isOnline ? "cloud-done" : "cloud-offline"} 
          size={20} 
          color={connectionStatus.isOnline ? "#4CAF50" : "#f44336"} 
        />
        <Text style={[
          styles.statusText, 
          { color: connectionStatus.isOnline ? "#4CAF50" : "#f44336" }
        ]}>
          {connectionStatus.isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={handleTestConnection}
        disabled={isTestingConnection}
      >
        <Ionicons name="refresh" size={16} color="white" />
        <Text style={styles.buttonText}>
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default ConnectionTest;