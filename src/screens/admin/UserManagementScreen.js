import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const UserManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    status: 'active'
  });
  const [userOrders, setUserOrders] = useState([]);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'customer')
      );
      const querySnapshot = await getDocs(q);
      
      const usersData = [];
      const stats = {};
      
      // Fetch user data and calculate stats
      for (const userDoc of querySnapshot.docs) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        
        // Skip deleted users
        if (userData.deleted === true) {
          continue;
        }
        
        // Get user's order count and total spent
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', userDoc.id)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        let totalSpent = 0;
        let completedOrders = 0;
        let allOrdersCount = 0;
        
        ordersSnapshot.docs.forEach(orderDoc => {
          const orderData = orderDoc.data();
          allOrdersCount++;
          
          // Use the correct status values: 'Confirmed' instead of 'completed'
          if (orderData.status === 'Confirmed' || orderData.status === 'completed' || orderData.status === 'delivered') {
            // Use totalAmount field instead of total
            totalSpent += orderData.totalAmount || orderData.total || 0;
            completedOrders++;
          }
        });
        
        userData.orderCount = allOrdersCount;
        userData.totalSpent = totalSpent;
        userData.completedOrders = completedOrders;
        
        usersData.push(userData);
        stats[userDoc.id] = {
          orderCount: allOrdersCount,
          totalSpent,
          completedOrders
        };
      }
      
      setUsers(usersData);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const viewUserDetails = async (user) => {
    try {
      setSelectedUser(user);
      
      // Fetch user's orders with product details
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.id)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const orders = [];
      let totalSpent = 0;
      let completedOrders = 0;
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        
        // Fetch product details for each order item
        const orderItems = [];
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            try {
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
                console.warn(`Order ${orderData.id}: No productId found in any expected field`, item);
                orderItems.push({
                  ...item,
                  productName: item.name || item.productName || 'Unknown Product (No ID)',
                  unitPrice: item.price || item.unitPrice || 0
                });
                continue;
              }

              // Ensure productId is a string
              const cleanProductId = String(productId).trim();
              if (!cleanProductId) {
                console.warn(`Order ${orderData.id}: Empty productId after trim`, item);
                orderItems.push({
                  ...item,
                  productName: item.name || item.productName || 'Unknown Product (Invalid ID)',
                  unitPrice: item.price || item.unitPrice || 0
                });
                continue;
              }

              // Fetch product details from products collection
              const productDoc = await getDoc(doc(db, 'products', cleanProductId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                orderItems.push({
                  ...item,
                  productName: productData.name || item.name || item.productName || 'Unnamed Product',
                  productImage: productData.images?.[0],
                  unitPrice: productData.price || item.price || item.unitPrice || 0
                });
              } else {
                // Fallback if product not found
                console.warn(`Product not found: ${cleanProductId}`);
                orderItems.push({
                  ...item,
                  productName: item.name || item.productName || 'Product not found',
                  unitPrice: item.price || item.unitPrice || 0
                });
              }
            } catch (error) {
              console.error('Error fetching product:', item, error);
              orderItems.push({
                ...item,
                productName: 'Error loading product',
                unitPrice: item.price || 0
              });
            }
          }
        }
        
        orderData.items = orderItems;
        orders.push(orderData);
        
        // Calculate statistics
        if (orderData.total) {
          totalSpent += parseFloat(orderData.total);
        }
        if (orderData.status === 'completed' || orderData.status === 'delivered') {
          completedOrders++;
        }
      }
      
      // Sort orders by date (most recent first)
      orders.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
        return bDate - aDate;
      });
      
      // Update user object with calculated statistics
      const userWithStats = {
        ...user,
        orderCount: orders.length,
        completedOrders: completedOrders,
        totalSpent: totalSpent
      };
      
      setSelectedUser(userWithStats);
      setUserOrders(orders);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to fetch user details');
    }
  };

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', user.id), {
                status: newStatus,
                updatedAt: new Date()
              });
              
              Alert.alert('Success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
              fetchUsers();
            } catch (error) {
              console.error('Error updating user status:', error);
              Alert.alert('Error', 'Failed to update user status');
            }
          }
        }
      ]
    );
  };

  const editUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      displayName: user.displayName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      status: user.status || 'active'
    });
    setEditModalVisible(true);
  };

  const saveUserEdit = async () => {
    if (!editFormData.displayName.trim() || !editFormData.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        displayName: editFormData.displayName.trim(),
        email: editFormData.email.trim(),
        phoneNumber: editFormData.phoneNumber.trim(),
        status: editFormData.status,
        updatedAt: new Date()
      });

      Alert.alert('Success', 'User updated successfully');
      setEditModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const deleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.displayName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user document
              await updateDoc(doc(db, 'users', user.id), {
                deleted: true,
                deletedAt: new Date(),
                status: 'deleted'
              });
              
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={[styles.userAvatarText, { color: theme.colors.text }]}>
              {item.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
            {/* Online Status Indicator */}
            <View style={[
              styles.onlineStatusIndicator,
              { backgroundColor: (item.status === 'inactive') ? '#e74c3c' : '#27ae60' }
            ]} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{item.displayName || 'Unknown User'}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{item.email}</Text>
            <View style={styles.userStats}>
              <Text style={[styles.statText, { color: theme.colors.primary }]}>
                {item.orderCount || 0} orders • ₱{(item.totalSpent || 0).toLocaleString()} spent
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.userMeta}>
          <Text style={[styles.joinDate, { color: theme.colors.textMuted }]}>
            Joined: {item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
          </Text>
          {item.phoneNumber && (
            <Text style={[styles.phoneNumber, { color: theme.colors.textSecondary }]}>📱 {item.phoneNumber}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => viewUserDetails(item)}
        >
          <Ionicons name="eye" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editUser(item)}
        >
          <Ionicons name="pencil" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => toggleUserStatus(item)}
        >
          <Ionicons 
            name={item.status === 'inactive' ? 'checkmark' : 'ban'} 
            size={16} 
            color="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteUser(item)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search users by name or email..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Users will appear here when they register'}
            </Text>
          </View>
        }
      />

      {/* User Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>User Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalUserInfo}>
                  <View style={styles.modalUserAvatar}>
                    <Text style={[styles.modalUserAvatarText, { color: theme.colors.text }]}>
                      {selectedUser.displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.modalUserDetails}>
                    <Text style={[styles.modalUserName, { color: theme.colors.text }]}>{selectedUser.displayName}</Text>
                    <Text style={[styles.modalUserEmail, { color: theme.colors.textSecondary }]}>{selectedUser.email}</Text>
                    {selectedUser.phoneNumber && (
                      <Text style={[styles.modalUserPhone, { color: theme.colors.textSecondary }]}>📱 {selectedUser.phoneNumber}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: theme.colors.text }]}>{selectedUser.orderCount || 0}</Text>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.textSecondary }]}>Total Orders</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: theme.colors.text }]}>{selectedUser.completedOrders || 0}</Text>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={[styles.modalStatValue, { color: theme.colors.primary }]}>₱{(selectedUser.totalSpent || 0).toLocaleString()}</Text>
                    <Text style={[styles.modalStatLabel, { color: theme.colors.textSecondary }]}>Total Spent</Text>
                  </View>
                </View>

                <Text style={[styles.ordersTitle, { color: theme.colors.text }]}>Recent Orders</Text>
                {userOrders.length > 0 ? (
                  userOrders.slice(0, 5).map((order) => (
                    <View key={order.id} style={[styles.orderItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <View style={styles.orderHeader}>
                        <View style={styles.orderInfo}>
                          <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
                            {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown Date'}
                          </Text>
                          <Text style={[styles.orderTotal, { color: theme.colors.primary }]}>₱{(order.total || 0).toLocaleString()}</Text>
                        </View>
                        <Text style={[styles.orderStatus, {
                          color: order.status === 'completed' ? '#27ae60' : 
                                 order.status === 'delivered' ? '#27ae60' :
                                 order.status === 'pending' ? '#f39c12' : '#3498db'
                        }]}>
                          {order.status?.toUpperCase() || 'UNKNOWN'}
                        </Text>
                      </View>
                      
                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <View style={styles.orderItemsList}>
                          {order.items.map((item, index) => (
                            <View key={`${order.id}-${index}`} style={styles.orderProduct}>
                              <Text style={[styles.productName, { color: theme.colors.textSecondary }]}>
                                {item.productName || 'Unknown Product'}
                              </Text>
                              <View style={styles.productDetails}>
                                <Text style={[styles.productQuantity, { color: theme.colors.textMuted }]}>Qty: {item.quantity || 1}</Text>
                                <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                                  ₱{((item.unitPrice || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noOrdersText, { color: theme.colors.textMuted }]}>No orders found</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* User Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.editForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Display Name *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                  value={editFormData.displayName}
                  onChangeText={(text) => setEditFormData({...editFormData, displayName: text})}
                  placeholder="Enter display name"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                  value={editFormData.email}
                  onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                  value={editFormData.phoneNumber}
                  onChangeText={(text) => setEditFormData({...editFormData, phoneNumber: text})}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.statusOptions}>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      editFormData.status === 'active' && styles.statusOptionActive
                    ]}
                    onPress={() => setEditFormData({...editFormData, status: 'active'})}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      editFormData.status === 'active' && styles.statusOptionTextActive
                    ]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusOption,
                      editFormData.status === 'inactive' && styles.statusOptionActive
                    ]}
                    onPress={() => setEditFormData({...editFormData, status: 'inactive'})}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      editFormData.status === 'inactive' && styles.statusOptionTextActive
                    ]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveUserEdit}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#2e78b7',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 55,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statCard: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineStatusIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: 'white',
  },
  userAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  phoneNumber: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  statusButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalUserAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalUserDetails: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  modalUserPhone: {
    fontSize: 14,
    color: '#999',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderItemsList: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  orderProduct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
    marginRight: 10,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productQuantity: {
    fontSize: 12,
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#28a745',
  },
  noOrdersText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  editForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  statusOptionTextActive: {
    color: '#007AFF',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default UserManagementScreen;