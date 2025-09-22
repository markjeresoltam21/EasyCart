import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const { allOrders, getOrderStats } = useOrders();
  const { logout, user, userRole } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Update order stats when OrderContext data changes
    if (allOrders.length > 0) {
      const orderStats = getOrderStats();
      if (orderStats) {
        setStats(prevStats => ({
          ...prevStats,
          totalOrders: orderStats.total,
          pendingOrders: orderStats.pending,
          completedOrders: orderStats.delivered,
          totalRevenue: orderStats.totalRevenue
        }));
        
        // Set recent orders with product details (last 5)
        fetchRecentOrdersWithDetails(allOrders.slice(0, 5));
      }
    }
  }, [allOrders, getOrderStats, userRole]);

  const fetchRecentOrdersWithDetails = async (orders) => {
    try {
      // Debug: Log the orders structure
      console.log('Fetching details for orders:', orders.length);
      if (orders.length > 0) {
        console.log('Sample order structure:', JSON.stringify(orders[0], null, 2));
      }

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          if (!order.items || order.items.length === 0) {
            console.log(`Order ${order.id}: No items found`);
            return { ...order, itemsWithDetails: [] };
          }

          console.log(`Order ${order.id}: Processing ${order.items.length} items`);

          // Fetch product details for each item
          const itemsWithDetails = await Promise.all(
            order.items.map(async (item, index) => {
              try {
                // Debug: Log item structure
                console.log(`Order ${order.id}, item ${index}:`, JSON.stringify(item, null, 2));

                // Try to extract productId from different possible structures
                let productId = null;
                
                if (item.productId) {
                  productId = item.productId;
                } else if (item.id) {
                  productId = item.id;
                } else if (item.product?.id) {
                  productId = item.product.id;
                } else if (item.product?.productId) {
                  productId = item.product.productId;
                }

                // Validate productId exists
                if (!productId) {
                  console.warn(`Order ${order.id}, item ${index}: No productId found in any expected field`, item);
                  return {
                    ...item,
                    productName: item.name || item.productName || 'Unknown Product (No ID)',
                    unitPrice: item.price || item.unitPrice || 0
                  };
                }

                // Ensure productId is a string
                const cleanProductId = String(productId).trim();
                if (!cleanProductId) {
                  console.warn(`Order ${order.id}, item ${index}: Empty productId after trim`, item);
                  return {
                    ...item,
                    productName: item.name || item.productName || 'Unknown Product (Invalid ID)',
                    unitPrice: item.price || item.unitPrice || 0
                  };
                }

                console.log(`Fetching product: ${cleanProductId}`);
                const productDoc = await getDoc(doc(db, 'products', cleanProductId));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  return {
                    ...item,
                    productName: productData.name || item.name || item.productName || 'Unnamed Product',
                    productImage: productData.images?.[0],
                    unitPrice: productData.price || item.price || item.unitPrice || 0
                  };
                } else {
                  console.warn(`Product not found: ${cleanProductId}`);
                  return {
                    ...item,
                    productName: item.name || item.productName || 'Product not found',
                    unitPrice: item.price || item.unitPrice || 0
                  };
                }
              } catch (error) {
                console.error(`Error fetching product for item:`, item, error);
                return {
                  ...item,
                  productName: 'Error loading product',
                  unitPrice: item.price || 0
                };
              }
            })
          );

          return { ...order, itemsWithDetails };
        })
      );

      setRecentOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setRecentOrders(orders); // Fallback to orders without details
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch non-order statistics
      const [
        productsSnapshot,
        usersSnapshot,
        lowStockSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
        getDocs(query(collection(db, 'products'), where('stock', '<=', 10)))
      ]);

      // Set non-order statistics
      setStats(prevStats => ({
        ...prevStats,
        totalProducts: productsSnapshot.size,
        totalUsers: usersSnapshot.size,
      }));

      // Set low stock products
      const lowStockData = lowStockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLowStockProducts(lowStockData);

      // Fetch user profile data
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              setShowProfileModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const ProfileModal = () => (
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
        <View style={styles.profileDropdown}>
          <View style={styles.profileHeader}>
            <Ionicons name="person-circle" size={40} color="#667eea" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || user?.email || 'Admin User'}
              </Text>
              <Text style={styles.profileRole}>Administrator</Text>
            </View>
          </View>
          
          <View style={styles.profileDivider} />
          
          <TouchableOpacity
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate('AdminProfile');
            }}
          >
            <Ionicons name="person-outline" size={20} color="#2c3e50" />
            <Text style={styles.profileMenuText}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.profileMenuItem}
            onPress={() => {
              setShowProfileModal(false);
              navigation.navigate('AdminSettings');
            }}
          >
            <Ionicons name="settings-outline" size={20} color="#2c3e50" />
            <Text style={styles.profileMenuText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.profileMenuItem, styles.logoutMenuItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={[styles.profileMenuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const StatCard = ({ title, value, icon, color, onPress, subtitle }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color, backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statCardContent}>
        <View style={styles.statInfo}>
          <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
          {subtitle && <Text style={[styles.statSubtitle, { color: theme.colors.warning }]}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <ProfileModal />
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back! Here's your store overview</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.profileIconContainer}>
              {userProfile?.profilePicture ? (
                <Image 
                  source={{ uri: userProfile.profilePicture }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.defaultProfileIcon}>
                  <Text style={styles.profileInitial}>
                    {(userProfile?.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Statistics Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📊 Overview Statistics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Products"
              value={stats.totalProducts.toString()}
              icon="cube-outline"
              color="#3498db"
              onPress={() => navigation.navigate('Products')}
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders.toString()}
              icon="receipt-outline"
              color="#2ecc71"
              onPress={() => navigation.navigate('Orders')}
            />
            <StatCard
              title="Pending Orders"
              value={stats.pendingOrders.toString()}
              icon="time-outline"
              color="#f39c12"
              onPress={() => navigation.navigate('Orders')}
              subtitle="Needs attention"
            />
            <StatCard
              title="Completed Orders"
              value={stats.completedOrders.toString()}
              icon="checkmark-circle-outline"
              color="#27ae60"
              onPress={() => navigation.navigate('Orders')}
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toString()}
              icon="people-outline"
              color="#9b59b6"
              onPress={() => navigation.navigate('Users')}
            />
            <StatCard
              title="Total Revenue"
              value={`₱${stats.totalRevenue.toLocaleString()}`}
              icon="trending-up-outline"
              color="#e74c3c"
            />
          </View>
        </View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📋 Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={[styles.viewAllButton, { color: theme.colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderCustomer, { color: theme.colors.text }]}>
                    {order.customerInfo?.name || order.customerName || 'Unknown Customer'}
                  </Text>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: (order.status === 'Confirmed' || order.status === 'confirmed' || order.status === 'completed' || order.status === 'Delivered') ? '#27ae60' : 
                                   order.status === 'pending' || order.status === 'Pending' ? '#f39c12' : 
                                   order.status === 'Processing' || order.status === 'processing' ? '#3498db' :
                                   order.status === 'cancelled' ? '#e74c3c' : '#3498db'
                  }]}>
                    <Text style={styles.statusText}>
                      {order.status === 'Confirmed' || order.status === 'confirmed' || order.status === 'completed' ? 'Delivered' :
                       order.status === 'pending' || order.status === 'Pending' ? 'Pending' :
                       order.status === 'Processing' || order.status === 'processing' ? 'Processing' :
                       order.status || 'Processing'}
                    </Text>
                  </View>
                </View>
                
                {/* Product Details */}
                <View style={styles.productsList}>
                  {order.itemsWithDetails && order.itemsWithDetails.length > 0 ? (
                    <>
                      {order.itemsWithDetails.slice(0, 2).map((item, index) => (
                        <View key={index} style={styles.productItem}>
                          <Text style={[styles.productName, { color: theme.colors.textSecondary }]}>
                            {item.productName} x{item.quantity || 1}
                          </Text>
                          <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                            ₱{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </Text>
                        </View>
                      ))}
                      {order.itemsWithDetails.length > 2 && (
                        <Text style={[styles.moreItems, { color: theme.colors.textMuted }]}>
                          +{order.itemsWithDetails.length - 2} more items
                        </Text>
                      )}
                    </>
                  ) : (
                    <View style={styles.productItem}>
                      <Text style={[styles.productName, { color: theme.colors.textSecondary }]}>
                        {order.items?.length || 0} item(s)
                      </Text>
                      <Text style={[styles.productPrice, { color: theme.colors.textMuted }]}>
                        Details loading...
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.orderFooter}>
                  <Text style={[styles.orderTotalLarge, { color: theme.colors.primary }]}>
                    ₱{(order.totalAmount || order.total || 0).toLocaleString()}
                  </Text>
                  {order.createdAt?.toDate?.()?.toLocaleDateString() && (
                    <Text style={[styles.orderDate, { color: theme.colors.textMuted }]}>
                      {order.createdAt.toDate().toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>⚠️ Low Stock Alert</Text>
            {lowStockProducts.map((product) => (
              <View key={product.id} style={[styles.alertCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Ionicons name="warning-outline" size={20} color={theme.colors.warning} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertProductName, { color: theme.colors.text }]}>{product.name}</Text>
                  <Text style={[styles.alertStock, { color: theme.colors.textSecondary }]}>Only {product.stock} left in stock</Text>
                </View>
                <TouchableOpacity
                  style={[styles.alertButton, { backgroundColor: theme.colors.warning }]}
                  onPress={() => navigation.navigate('EditProduct', { product })}
                >
                  <Text style={styles.alertButtonText}>Restock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileButton: {
    marginLeft: 15,
  },
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  defaultProfileIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  viewAllButton: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderCustomer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ecf0f1',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  orderTotalLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  productsList: {
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  moreItems: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertStock: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 2,
  },
  alertButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  profileDropdown: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  profileRole: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  profileMenuText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  logoutText: {
    color: '#e74c3c',
  },
});

export default AdminDashboardScreen;