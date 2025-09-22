import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const EmailVerificationHandler = () => {
  const { emailVerificationCheck, clearEmailVerificationCheck } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (emailVerificationCheck && emailVerificationCheck.verified) {
      // Show success message and navigate to sign in
      Alert.alert(
        '✅ Email Verified!',
        emailVerificationCheck.message,
        [
          {
            text: 'Sign In Now',
            onPress: () => {
              clearEmailVerificationCheck();
              // Navigate to sign in screen
              navigation.navigate('SignIn');
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, [emailVerificationCheck, navigation, clearEmailVerificationCheck]);

  return null; // This component doesn't render anything
};

export default EmailVerificationHandler;