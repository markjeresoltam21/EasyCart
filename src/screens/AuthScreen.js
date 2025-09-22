import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  
  const { signup, login, resendVerificationEmail, checkEmailVerification } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && !displayName) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const user = await login(email, password);
        if (!user.emailVerified) {
          setShowResendOption(true);
          Alert.alert(
            'Email Not Verified',
            'Please check your email and verify your account before logging in.\n\nIf you didn\'t receive the email, you can resend it using the button below.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const result = await signup(email, password, displayName);
        if (result.emailSent) {
          Alert.alert(
            'Account Created!',
            'A verification email has been sent to your email address. Please verify your email before logging in.',
            [{ text: 'OK' }]
          );
          setIsLogin(true); // Switch to login mode
          setDisplayName(''); // Clear display name
          setShowResendOption(true); // Show resend option after signup
        }
      }
    } catch (error) {
      let errorMessage = error.message;
      
      // Customize error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType) => {
    if (userType === 'admin') {
      setEmail('markjeresoltam@gmail.com');
      setPassword('admin123');
    } else if (userType === 'kim') {
      setEmail('kim.duites@easycart.com');
      setPassword('user123');
    } else if (userType === 'rolly') {
      setEmail('rolly.junsay@easycart.com');
      setPassword('user123');
    } else {
      setEmail('ria.balana@easycart.com');
      setPassword('user123');
    }
    setShowResendOption(false); // Hide resend option when using quick login
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password first');
      return;
    }

    setLoading(true);
    try {
      const result = await resendVerificationEmail(email, password);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Info', result.message);
        setShowResendOption(false); // Hide if already verified
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password first');
      return;
    }

    setLoading(true);
    try {
      const result = await checkEmailVerification(email, password);
      if (result.verified) {
        Alert.alert('Success', result.message);
        setShowResendOption(false); // Hide resend option after verification
      } else {
        Alert.alert('Not Verified', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check verification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.logo}>🛒</Text>
          <Text style={styles.title}>EasyCart</Text>
          <Text style={styles.subtitle}>Your Simple Shopping Solution</Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setShowResendOption(false); // Hide resend option when switching modes
            }}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

          {/* Email Verification Options */}
          {showResendOption && isLogin && (
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationText}>
                Need help with email verification?
              </Text>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleCheckVerification}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  Check if Email is Verified
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleResendVerification}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  Resend Verification Email
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.quickLogin}>
            <Text style={styles.quickLoginTitle}>Quick Login:</Text>
            <View style={styles.quickButtonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.adminButton]}
                onPress={() => handleQuickLogin('admin')}
              >
                <Text style={styles.buttonText}>Mark (Admin)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.userButton]}
                onPress={() => handleQuickLogin('kim')}
              >
                <Text style={styles.buttonText}>Kim</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.quickButtonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.userButton]}
                onPress={() => handleQuickLogin('rolly')}
              >
                <Text style={styles.buttonText}>Rolly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.userButton]}
                onPress={() => handleQuickLogin('ria')}
              >
                <Text style={styles.buttonText}>Ria</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.button, styles.migrationButton]}
              onPress={() => navigation.navigate('DatabaseMigration')}
            >
              <Text style={styles.buttonText}>Setup Database</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e78b7',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2e78b7',
  },
  adminButton: {
    backgroundColor: '#e74c3c',
    flex: 1,
    marginRight: 5,
  },
  userButton: {
    backgroundColor: '#27ae60',
    flex: 1,
    marginLeft: 5,
  },
  migrationButton: {
    backgroundColor: '#9b59b6',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    color: '#2e78b7',
    fontSize: 16,
  },
  verificationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  verificationText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2e78b7',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#2e78b7',
    fontSize: 14,
    fontWeight: '600',
  },
  quickLogin: {
    marginTop: 20,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  quickButtonsContainer: {
    flexDirection: 'row',
  },
});

export default AuthScreen;