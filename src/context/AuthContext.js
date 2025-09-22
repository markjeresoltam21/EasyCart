import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { firestoreOperations } from '../services/firestoreUtils';
import { AppState, Alert } from 'react-native';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerificationCheck, setEmailVerificationCheck] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user role from Firestore with retry logic
        try {
          const userData = await firestoreOperations.getDocument('users', user.uid);
          if (userData) {
            setUserRole(userData.role);
          } else {
            console.log('User document not found, setting default role');
            setUserRole('customer');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Show user-friendly error message
          if (error.message.includes('offline') || error.message.includes('network')) {
            Alert.alert(
              'Connection Issue', 
              'Unable to connect to server. Please check your internet connection. The app will work in offline mode.',
              [{ text: 'OK' }]
            );
            // Set a default role to allow app to function
            setUserRole('customer');
          }
        }
      } else {
        setUserRole(null);
      }
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle app state changes to check for email verification
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && auth.currentUser && !auth.currentUser.emailVerified) {
        // App became active, check if email was verified while user was away
        try {
          await reload(auth.currentUser);
          if (auth.currentUser.emailVerified) {
            console.log('Email verification detected on app resume');
            // Update Firestore with enhanced operations
            await firestoreOperations.updateDocument('users', auth.currentUser.uid, {
              emailVerified: true,
              verifiedAt: new Date(),
              updatedAt: new Date()
            });
            
            // Set verification status for navigation handling
            setEmailVerificationCheck({
              verified: true,
              message: 'Email verified successfully! Please sign in to continue.',
              timestamp: Date.now()
            });
            
            // Sign out user so they need to sign in with verified email
            await signOut(auth);
          }
        } catch (error) {
          console.error('Error checking verification on app resume:', error);
          // Don't block the app if this fails
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const signup = async (email, password, displayName, role = 'customer') => {
    try {
      console.log('Creating user account...', { email, role });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User account created, sending verification email...');
      
      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log('Email verification sent successfully to:', email);
        
        // Create user profile in Firestore with enhanced operations
        console.log('Creating user profile in Firestore...');
        await firestoreOperations.setDocument('users', user.uid, {
          email: user.email,
          displayName: displayName,
          role: role,
          emailVerified: false,
          phoneNumber: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          verificationEmailSent: true,
          verificationEmailSentAt: new Date()
        });
        
        // Sign out the user immediately after registration
        // They need to verify email before they can login
        await signOut(auth);
        
        console.log('User signup process completed');
        return { 
          user: null, // User is signed out
          emailSent: true, 
          message: 'Account created successfully! Please check your email and click the verification link before logging in.' 
        };
        
      } catch (emailError) {
        console.error('Error sending email verification:', emailError);
        console.log('Email error code:', emailError.code);
        console.log('Email error message:', emailError.message);
        
        // Still create the user profile but mark email as not sent
        await firestoreOperations.setDocument('users', user.uid, {
          email: user.email,
          displayName: displayName,
          role: role,
          emailVerified: false,
          phoneNumber: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          verificationEmailSent: false,
          verificationEmailSentAt: null
        });
        
        // Sign out the user
        await signOut(auth);
        
        throw new Error('Account created but failed to send verification email. Please try to resend the verification email.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Reload user to get the latest emailVerified status
      await reload(user);
      
      // For existing demo users, we'll allow login without email verification
      const existingDemoUsers = [
        'markjeresoltam@gmail.com',
        'kim.duites@easycart.com',
        'rolly.junsay@easycart.com',
        'ria.balana@easycart.com',
        'julie.banayag@easycart.com'
      ];
      
      // If it's an existing demo user or email is verified, allow login
      if (existingDemoUsers.includes(email.toLowerCase()) || user.emailVerified) {
        // Update emailVerified status in Firestore if it was just verified
        if (user.emailVerified) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && !userDoc.data().emailVerified) {
              await updateDoc(doc(db, 'users', user.uid), {
                emailVerified: true,
                verifiedAt: new Date(),
                updatedAt: new Date()
              });
            }
          } catch (firestoreError) {
            console.error('Error updating email verification status in Firestore:', firestoreError);
            // Don't prevent login if Firestore update fails
          }
        }
        return user;
      }
      
      // For new users, require email verification
      if (!user.emailVerified) {
        // Sign out the user since they need to verify email first
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      throw error;
    }
  };

  const resendVerificationEmail = async (email, password) => {
    try {
      // Re-authenticate user to get current user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if already verified
      await reload(user);
      if (user.emailVerified) {
        await signOut(auth);
        return { 
          success: false, 
          message: 'Email is already verified. You can now log in.' 
        };
      }
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Update Firestore record
      await updateDoc(doc(db, 'users', user.uid), {
        verificationEmailSent: true,
        verificationEmailSentAt: new Date(),
        updatedAt: new Date()
      });
      
      // Sign out user after sending email
      await signOut(auth);
      
      return { 
        success: true, 
        message: 'Verification email sent successfully! Please check your inbox.' 
      };
      
    } catch (error) {
      console.error('Error resending verification email:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else {
        throw new Error('Failed to send verification email. Please try again.');
      }
    }
  };

  const checkEmailVerification = async (email, password) => {
    try {
      // Re-authenticate to get latest user state
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Reload to get latest emailVerified status
      await reload(user);
      
      if (user.emailVerified) {
        // Update Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date()
        });
        
        return { 
          verified: true, 
          user: user,
          message: 'Email verified successfully! You can now access your account.' 
        };
      } else {
        // Sign out if not verified
        await signOut(auth);
        return { 
          verified: false, 
          user: null,
          message: 'Email not yet verified. Please check your inbox and click the verification link.' 
        };
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
      throw error;
    }
  };

  const clearEmailVerificationCheck = () => {
    setEmailVerificationCheck(null);
  };

  const updateUserProfile = async (profileData) => {
    if (user) {
      // Update the user state with new profile data
      const updatedUser = {
        ...user,
        ...profileData,
        displayName: profileData.displayName || user.displayName,
        profilePicture: profileData.profilePicture || user.profilePicture,
      };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      isLoading, 
      emailVerificationCheck,
      signup, 
      login, 
      logout,
      resendVerificationEmail,
      checkEmailVerification,
      clearEmailVerificationCheck,
      updateUserProfile,
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};