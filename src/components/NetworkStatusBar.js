import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const NetworkStatusBar = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected);
      
      // Show status bar when connection changes
      if (!connected) {
        setShowStatus(true);
      } else {
        // Hide after a brief moment when connection is restored
        setTimeout(() => setShowStatus(false), 3000);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!showStatus) return null;

  return (
    <View style={[styles.container, isConnected ? styles.online : styles.offline]}>
      <Ionicons 
        name={isConnected ? "wifi" : "wifi-off"} 
        size={16} 
        color="white" 
      />
      <Text style={styles.text}>
        {isConnected ? 'Back online' : 'No internet connection - working offline'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#f44336',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default NetworkStatusBar;