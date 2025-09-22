import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SweetAlert from '../../utils/SweetAlert';

const CartScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    clearCart,
  } = useCart();

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileModal(false);
      SweetAlert.success('Logged Out', 'You have been successfully logged out');
      // Navigation will be handled by AuthContext
    } catch (error) {
      SweetAlert.error('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      SweetAlert.confirm(
        'Remove Item',
        'Are you sure you want to remove this item from cart?',
        () => {
          removeFromCart(productId);
          SweetAlert.success('Item Removed', 'Item has been removed from your cart');
        }
      );
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      SweetAlert.warning('Empty Cart', 'Please add items to cart before checkout');
      return;
    }
    navigation.navigate('Checkout');
  };

  const handleClearCart = () => {
    SweetAlert.confirm(
      'Clear Cart',
      'Are you sure you want to remove all items from cart?',
      () => {
        clearCart();
        SweetAlert.success('Cart Cleared', 'All items have been removed from your cart');
      }
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>
        <Text style={styles.itemTotal}>
          Total: ₱{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color="#2e78b7" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color="#2e78b7" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Shopping Cart</Text>
              <Text style={styles.headerSubtitle}>Review your selected items</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setShowProfileModal(true)}
            >
              <View style={styles.profileIconContainer}>
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
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={theme.colors.textMuted} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Add some products to get started</Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>

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
                <Text style={[styles.profileMenuText, { color: theme.colors.text }]}>Update Profile</Text>
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
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#1976D2', '#2196F3', '#64B5F6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../../../assets/images/easycart.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Shopping Cart</Text>
              <Text style={styles.headerSubtitle}>Review your selected items</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
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
        </View>
        
        <Text style={styles.welcomeText}>Manage your cart and proceed to checkout</Text>
      </LinearGradient>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        style={styles.cartList}
      />

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>
            ₱{getCartTotal().toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>

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
  headerContent: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cartList: {
    flex: 1,
    padding: 15,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    padding: 5,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  checkoutButton: {
    backgroundColor: '#2e78b7',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#2e78b7',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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

export default CartScreen;