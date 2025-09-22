import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AdminNavigator from './AdminNavigator';
import UserNavigator from './UserNavigator';
import AuthScreen from '../screens/AuthScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoadingScreen from '../screens/LoadingScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import DatabaseMigrationScreen from '../screens/DatabaseMigrationScreen';
import HomeScreen from '../screens/HomeScreen';
import PublicProductDetailScreen from '../screens/PublicProductDetailScreen';
import EmailVerificationHandler from '../components/EmailVerificationHandler';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, userRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Check if user's email is verified
          (() => {
            // Allow existing demo users to login without email verification
            const existingDemoUsers = [
              'markjeresoltam@gmail.com',
              'kim.duites@easycart.com', 
              'rolly.junsay@easycart.com',
              'ria.balana@easycart.com',
              'julie.banayag@easycart.com'
            ];
            
            const isExistingUser = existingDemoUsers.includes(user.email?.toLowerCase());
            const isEmailVerified = user.emailVerified || isExistingUser;
            
            if (isEmailVerified) {
              // Check user role for navigation
              return userRole === 'admin' ? (
                <Stack.Screen name="AdminApp" component={AdminNavigator} />
              ) : (
                <Stack.Screen name="UserApp" component={UserNavigator} />
              );
            } else {
              return (
                <Stack.Screen 
                  name="EmailVerification" 
                  component={EmailVerificationScreen}
                  options={{ headerShown: true, title: 'Verify Email' }}
                />
              );
            }
          })()
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen 
              name="ProductDetail" 
              component={PublicProductDetailScreen}
              options={{ 
                headerShown: true, 
                title: 'Product Details',
                headerBackTitleVisible: false,
                headerTintColor: '#2e78b7',
              }}
            />
            <Stack.Screen 
              name="SignIn" 
              component={SignInScreen} 
              options={{ 
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen} 
              options={{ 
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ 
                headerShown: true, 
                title: 'Login / Sign Up',
                headerBackTitleVisible: false,
                headerTintColor: '#2e78b7',
              }}
            />
            <Stack.Screen 
              name="DatabaseMigration" 
              component={DatabaseMigrationScreen}
              options={{ 
                headerShown: true, 
                title: 'Database Setup',
                headerBackTitleVisible: false,
                headerTintColor: '#2e78b7',
              }}
            />
          </>
        )}
      </Stack.Navigator>
      <EmailVerificationHandler />
    </NavigationContainer>
  );
};

export default RootNavigator;