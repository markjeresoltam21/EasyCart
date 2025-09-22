import { Alert } from 'react-native';

const SweetAlert = {
  // Success alert
  success: (title, message = '', onConfirm = null) => {
    Alert.alert(
      `✅ ${title}`,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onConfirm
        }
      ],
      { cancelable: false }
    );
  },

  // Error alert
  error: (title, message = '', onConfirm = null) => {
    Alert.alert(
      `❌ ${title}`,
      message,
      [
        {
          text: 'OK',
          style: 'destructive',
          onPress: onConfirm
        }
      ],
      { cancelable: false }
    );
  },

  // Warning alert
  warning: (title, message = '', onConfirm = null) => {
    Alert.alert(
      `⚠️ ${title}`,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onConfirm
        }
      ],
      { cancelable: false }
    );
  },

  // Info alert
  info: (title, message = '', onConfirm = null) => {
    Alert.alert(
      `ℹ️ ${title}`,
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onConfirm
        }
      ],
      { cancelable: false }
    );
  },

  // Confirmation alert
  confirm: (title, message = '', onConfirm = null, onCancel = null) => {
    Alert.alert(
      `❓ ${title}`,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: onConfirm
        }
      ],
      { cancelable: false }
    );
  },

  // Loading/Processing alert (shows then auto-dismisses)
  loading: (title, message = 'Please wait...') => {
    Alert.alert(
      `⏳ ${title}`,
      message,
      [],
      { cancelable: false }
    );
  },

  // Custom alert with custom buttons
  custom: (title, message, buttons) => {
    Alert.alert(title, message, buttons);
  }
};

export default SweetAlert;