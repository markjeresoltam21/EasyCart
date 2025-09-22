import { Alert } from 'react-native';

export const showFirebaseConnectionHelp = () => {
  Alert.alert(
    'Firebase Connection Issues',
    `If you're experiencing connection issues, try these steps:

1. Check Internet Connection
   • Ensure WiFi or mobile data is enabled
   • Try opening a web browser to test connectivity

2. Restart the App
   • Close the app completely
   • Reopen it to refresh the connection

3. Check Firebase Status
   • Firebase services may be temporarily down
   • Try again after a few minutes

4. Clear App Cache (if issues persist)
   • Go to device Settings > Apps > EasyCart
   • Clear Cache (not Data)

5. Network Issues
   • Try switching between WiFi and mobile data
   • Some corporate networks block Firebase

The app works in offline mode with limited functionality when disconnected.`,
    [
      { text: 'OK', style: 'default' }
    ]
  );
};

export const CONNECTION_ERRORS = {
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  NETWORK: 'network',
  PERMISSION_DENIED: 'permission-denied',
  UNAVAILABLE: 'unavailable'
};

export const getFirebaseErrorMessage = (error) => {
  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  if (errorCode.includes('offline') || errorMessage.includes('offline')) {
    return 'You appear to be offline. Some features may be limited.';
  }

  if (errorCode.includes('unavailable') || errorMessage.includes('backend')) {
    return 'Server temporarily unavailable. Please try again in a moment.';
  }

  if (errorCode.includes('permission-denied')) {
    return 'Access denied. Please check your account permissions.';
  }

  if (errorCode.includes('timeout') || errorMessage.includes('timeout')) {
    return 'Connection timed out. Please check your internet connection.';
  }

  // Default message for unknown errors
  return 'Connection issue. Please check your internet connection and try again.';
};

export const handleFirebaseError = (error, showAlert = true) => {
  console.error('Firebase Error:', error);
  
  const userFriendlyMessage = getFirebaseErrorMessage(error);
  
  if (showAlert) {
    Alert.alert(
      'Connection Issue',
      userFriendlyMessage,
      [
        { text: 'Help', onPress: showFirebaseConnectionHelp },
        { text: 'OK', style: 'default' }
      ]
    );
  }
  
  return userFriendlyMessage;
};