import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Admin Screens
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ProductsManagementScreen from '../screens/admin/ProductsManagementScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import EditProductScreen from '../screens/admin/EditProductScreen';
import OrdersManagementScreen from '../screens/admin/OrdersManagementScreen';
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AdminPaymentMethodsScreen from '../screens/admin/AdminPaymentMethodsScreen';
import AdminOrderManagementScreen from '../screens/admin/AdminOrderManagementScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

// Components
import ProfileHeader from '../components/ProfileHeader';

// Error Boundary
import AdminErrorBoundary from '../components/AdminErrorBoundary';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'Products':
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            case 'Categories':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Users':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Payment':
              iconName = focused ? 'card' : 'card-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -1,
          },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 2,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Products" 
        component={ProductsManagementScreen}
        options={({ navigation }) => ({ 
          title: 'Products',
          header: () => <ProfileHeader navigation={navigation} title="Products Management" />,
        })}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoryManagementScreen}
        options={({ navigation }) => ({ 
          title: 'Categories',
          header: () => <ProfileHeader navigation={navigation} title="Category Management" />,
        })}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen}
        options={({ navigation }) => ({
          title: 'Dashboard',
          tabBarBadge: undefined,
          header: () => <ProfileHeader navigation={navigation} title="Admin Dashboard" />,
        })}
      />
      <Tab.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={({ navigation }) => ({ 
          title: 'Users',
          header: () => <ProfileHeader navigation={navigation} title="User Management" />,
        })}
      />
      <Tab.Screen 
        name="Payment" 
        component={AdminPaymentMethodsScreen}
        options={({ navigation }) => ({ 
          title: 'Payment',
          header: () => <ProfileHeader navigation={navigation} title="Payment Methods" />,
        })}
      />
    </Tab.Navigator>
  );
};

const AdminNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <AdminErrorBoundary>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
            elevation: 4,
            shadowOpacity: isDarkMode ? 0.4 : 0.3,
            shadowRadius: 4,
            shadowColor: '#000',
            shadowOffset: { height: 2, width: 0 },
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen 
          name="AdminTabs" 
          component={AdminTabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="AddProduct" 
          component={AddProductScreen}
          options={{ 
            title: 'Add New Product',
            headerLeft: ({ onPress }) => (
              <TouchableOpacity 
                onPress={onPress} 
                style={{ marginLeft: 15, padding: 5 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen 
          name="EditProduct" 
          component={EditProductScreen}
          options={{ 
            title: 'Edit Product',
            headerLeft: ({ onPress }) => (
              <TouchableOpacity 
                onPress={onPress} 
                style={{ marginLeft: 15, padding: 5 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen 
          name="Orders" 
          component={AdminOrderManagementScreen}
          options={{ 
            headerShown: false,  // Disable navigation header to avoid duplicate
          }}
        />
        <Stack.Screen 
          name="AdminProfile" 
          component={AdminProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AdminSettings" 
          component={AdminSettingsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </AdminErrorBoundary>
  );
};

export default AdminNavigator;