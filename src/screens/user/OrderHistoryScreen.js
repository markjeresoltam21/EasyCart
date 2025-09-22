import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const OrderHistoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { userOrders, loading } = useOrders();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileModal(false);
      // Navigation will be handled by AuthContext
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'Processing': return '#3498db';
      case 'Shipped': return '#9b59b6';
      case 'Delivered': return '#27ae60';
      case 'Cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderOrder = ({ item }) => (
    <View style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: theme.colors.text }]}>Order #{item.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
      
      <View style={styles.itemsContainer}>
        <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>Items:</Text>
        {item.items?.map((orderItem, index) => (
          <Text key={index} style={[styles.itemText, { color: theme.colors.textSecondary }]}>
            • {orderItem.name} x{orderItem.quantity}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>Total: ₱{item.totalAmount?.toFixed(2) || '0.00'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#1976D2', '#2196F3', '#64B5F6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../../../assets/images/easycart.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Order History</Text>
              <Text style={styles.headerSubtitle}>Track your previous orders</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={styles.profileButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {user?.profilePicture ? (
                <Image 
                  source={{ uri: user.profilePicture }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileIcon}>
                  <Text style={styles.profileInitial}>
                    {(user?.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.welcomeText}>View and track all your orders</Text>
      </LinearGradient>

      <FlatList
        data={userOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No orders found</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Your order history will appear here</Text>
          </View>
        }
      />

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={[styles.profileDropdown, { backgroundColor: theme.colors.card }]}>
            <View style={styles.profileHeader}>
              <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>
                  {user?.displayName || user?.email || 'User'}
                </Text>
                <Text style={[styles.profileRole, { color: theme.colors.textMuted }]}>Customer</Text>
              </View>
            </View>
            
            <View style={[styles.profileDivider, { backgroundColor: theme.colors.border }]} />
            
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => {
                setShowProfileModal(false);
                navigation.navigate('Profile');
              }}
            >
              <Ionicons name="person-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.profileMenuText, { color: theme.colors.text }]}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => {
                setShowProfileModal(false);
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color={theme.colors.text} />
              <Text style={[styles.profileMenuText, { color: theme.colors.text }]}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={[styles.profileMenuText, { color: theme.colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoImage: {
    width: 35,
    height: 35,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  profileButton: {
    padding: 3,
  },
  profileButtonGradient: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  defaultProfileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    marginBottom: 10,
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 13,
    marginBottom: 2,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  profileDropdown: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 12,
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    marginVertical: 8,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  profileMenuText: {
    marginLeft: 12,
    fontSize: 16,
  },
});

export default OrderHistoryScreen;