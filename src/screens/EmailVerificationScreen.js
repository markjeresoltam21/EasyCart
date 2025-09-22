import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification, reload } from 'firebase/auth';

const EmailVerificationScreen = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(cooldown => cooldown - 1);
      }, 1000);
    } else if (resendCooldown === 0 && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      setResendCooldown(60); // 60 second cooldown
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      await reload(user);
      // The auth context will automatically update when the user's email is verified
      if (user.emailVerified) {
        Alert.alert('Success', 'Your email has been verified!');
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Please check your email and click the verification link, then try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://img.icons8.com/color/96/000000/email.png' }}
          style={styles.icon}
        />
        
        <Text style={styles.title}>Verify Your Email</Text>
        
        <Text style={styles.subtitle}>
          We've sent a verification email to:
        </Text>
        
        <Text style={styles.email}>{user?.email}</Text>
        
        <Text style={styles.description}>
          Please check your email and click the verification link to continue.
          Don't forget to check your spam folder if you don't see it in your inbox.
        </Text>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleCheckVerification}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryButton, resendCooldown > 0 && styles.disabledButton]}
          onPress={handleResendVerification}
          disabled={isLoading || resendCooldown > 0}
        >
          <Text style={[styles.secondaryButtonText, resendCooldown > 0 && styles.disabledButtonText]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Use Different Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e78b7',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#2e78b7',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2e78b7',
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2e78b7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  disabledButtonText: {
    color: '#ccc',
  },
  logoutButton: {
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;