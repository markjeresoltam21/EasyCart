import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SweetAlert from '../../utils/SweetAlert';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const OrdersManagementScreen = () => {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#95a5a6' },
    { value: 'pending', label: 'Pending', color: '#f39c12' },
    { value: 'processing', label: 'Processing', color: '#3498db' },
    { value: 'shipped', label: 'Shipped', color: '#9b59b6' },
    { value: 'completed', label: 'Completed', color: '#27ae60' },
    { value: 'Confirmed', label: 'Confirmed', color: '#27ae60' },
    { value: 'delivered', label: 'Delivered', color: '#27ae60' },
    { value: 'cancelled', label: 'Cancelled', color: '#e74c3c' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, searchQuery]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData = [];
      for (const orderDoc of querySnapshot.docs) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        
        // Fetch user details
        if (orderData.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', orderData.userId));
            if (userDoc.exists()) {
              orderData.userDetails = userDoc.data();
            }
          } catch (error) {
            console.log('Error fetching user details:', error);
          }
        }
        
        // Fetch product details for order items
        orderData.itemsWithDetails = [];
        let itemsArray = orderData.items || orderData.products || orderData.cartItems || [];
        
        if (Array.isArray(itemsArray) && itemsArray.length > 0) {
          const productDetails = [];
          
          for (const item of itemsArray) {
            try {
              let productId = null;
              let quantity = 1;
              let price = 0;
              
              if (typeof item === 'string') {
                productId = item;
              } else if (item && typeof item === 'object') {
                // Your Firestore uses 'productId' field for product reference  
                productId = item.productId || item.id || item.product_id || item.product?.id;
                quantity = item.quantity || item.qty || 1;
                price = item.price || item.unitPrice || 0;
              }
              
              if (productId && typeof productId === 'string' && productId.trim() !== '') {
                const productDoc = await getDoc(doc(db, 'products', productId.trim()));
                if (productDoc.exists()) {
                  const productData = productDoc.data();
                  productDetails.push({
                    productId: productId,
                    productName: productData.name || 'Unnamed Product',
                    productImage: productData.image || null,
                    quantity: quantity,
                    price: price || productData.price || 0
                  });
                } else {
                  productDetails.push({
                    productId: productId,
                    productName: `Product Not Found (${productId})`,
                    productImage: null,
                    quantity: quantity,
                    price: price
                  });
                }
              } else {
                productDetails.push({
                  productName: 'Invalid Product Data',
                  productImage: null,
                  quantity: quantity,
                  price: price
                });
              }
            } catch (itemError) {
              console.error('Error processing order item:', itemError);
              productDetails.push({
                productName: 'Error Loading Product',
                productImage: null,
                quantity: 1,
                price: 0
              });
            }
          }
          
          orderData.itemsWithDetails = productDetails;
        }
        
        ordersData.push(orderData);
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      SweetAlert.error('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.customerName?.toLowerCase().includes(query) ||
        order.userDetails?.displayName?.toLowerCase().includes(query) ||
        order.userDetails?.email?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      SweetAlert.success('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      SweetAlert.error('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : '#95a5a6';
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const StatusFilterButton = ({ status, label, color, isActive, onPress }) => (
    <TouchableOpacity
      style={[
        styles.statusFilterButton,
        { borderColor: color },
        isActive && { backgroundColor: color }
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.statusFilterText,
        { color: isActive ? 'white' : color }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.customerName}>
            {item.customerInfo?.name || item.customerName || item.userDetails?.displayName || 'Unknown Customer'}
          </Text>
          <Text style={styles.orderDate}>
            {item.createdAt?.toDate?.()?.toLocaleDateString()} at{' '}
            {item.createdAt?.toDate?.()?.toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.orderMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
          </View>
          <Text style={styles.orderTotal}>₱{(item.totalAmount || item.total || 0).toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        {/* Product Details */}
        {item.itemsWithDetails && item.itemsWithDetails.length > 0 ? (
          <View style={styles.productsList}>
            {item.itemsWithDetails.slice(0, 2).map((product, index) => (
              <Text key={index} style={styles.productItem}>
                {product.productName} x{product.quantity} - ₱{(product.price * product.quantity).toLocaleString()}
              </Text>
            ))}
            {item.itemsWithDetails.length > 2 && (
              <Text style={styles.moreItems}>
                +{item.itemsWithDetails.length - 2} more items
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.itemsCount}>
            {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''} - Loading details...
          </Text>
        )}
        
        <Text style={styles.paymentMethod}>
          Payment: {item.paymentMethod || 'Not specified'}
        </Text>
        {(item.customerInfo?.address || item.address) && (
          <Text style={styles.address} numberOfLines={1}>
             {item.customerInfo?.address || item.address}
          </Text>
        )}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => viewOrderDetails(item)}
        >
          <Ionicons name="eye-outline" size={16} color="white" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        {item.status !== 'delivered' && item.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              const nextStatus = 
                item.status === 'pending' ? 'processing' :
                item.status === 'processing' ? 'shipped' :
                item.status === 'shipped' ? 'delivered' : 'delivered';
              
              updateOrderStatus(item.id, nextStatus);
            }}
          >
            <Ionicons name="checkmark-outline" size={16} color="white" />
            <Text style={styles.actionButtonText}>
              {item.status === 'pending' ? 'Process' :
               item.status === 'processing' ? 'Ship' :
               item.status === 'shipped' ? 'Deliver' : 'Update'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders Management</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>Total: {orders.length}</Text>
          <Text style={styles.statsText}>
            Pending: {orders.filter(o => o.status === 'pending').length}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
        <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search by customer name, email, or order ID..."
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

      {/* Status Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilters}
      >
        {statusOptions.map((option) => (
          <StatusFilterButton
            key={option.value}
            status={option.value}
            label={option.label}
            color={option.color}
            isActive={filterStatus === option.value}
            onPress={() => setFilterStatus(option.value)}
          />
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Orders will appear here when customers make purchases'
              }
            </Text>
          </View>
        }
      />

      {/* Order Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedOrder && (
                <View style={styles.modalBody}>
                  {/* Order Info */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Order ID:</Text>
                      <Text style={styles.infoValue}>#{selectedOrder.id}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                        <Text style={styles.statusText}>{selectedOrder.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Date:</Text>
                      <Text style={styles.infoValue}>
                        {selectedOrder.createdAt?.toDate?.()?.toLocaleDateString()} at{' '}
                        {selectedOrder.createdAt?.toDate?.()?.toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Total:</Text>
                      <Text style={styles.totalValue}>{selectedOrder.total?.toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>
                        {selectedOrder.customerName || selectedOrder.userDetails?.displayName || 'N/A'}
                      </Text>
                    </View>
                    {selectedOrder.userDetails?.email && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>{selectedOrder.userDetails.email}</Text>
                      </View>
                    )}
                    {selectedOrder.phone && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phone:</Text>
                        <Text style={styles.infoValue}>{selectedOrder.phone}</Text>
                      </View>
                    )}
                    {selectedOrder.address && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Address:</Text>
                        <Text style={styles.infoValue}>{selectedOrder.address}</Text>
                      </View>
                    )}
                  </View>

                  {/* Order Items */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {selectedOrder.itemsWithDetails && selectedOrder.itemsWithDetails.length > 0 ? (
                      selectedOrder.itemsWithDetails.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.productName}</Text>
                          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                          <Text style={styles.itemPrice}>₱{(item.price * item.quantity).toLocaleString()}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.itemRow}>
                        <Text style={styles.itemName}>Loading product details...</Text>
                        <Text style={styles.itemQuantity}>Items: {selectedOrder.items?.length || 0}</Text>
                        <Text style={styles.itemPrice}>-</Text>
                      </View>
                    )}
                  </View>

                  {/* Payment Info */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Method:</Text>
                      <Text style={styles.infoValue}>{selectedOrder.paymentMethod || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={styles.infoValue}>{selectedOrder.paymentStatus || 'Pending'}</Text>
                    </View>
                  </View>

                  {/* Status Update Buttons */}
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Update Status</Text>
                      <View style={styles.statusButtonsGrid}>
                        {statusOptions
                          .filter(option => option.value !== 'all' && option.value !== selectedOrder.status)
                          .map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={[styles.statusUpdateButton, { backgroundColor: option.color }]}
                              onPress={() => {
                                updateOrderStatus(selectedOrder.id, option.value);
                                setModalVisible(false);
                              }}
                            >
                              <Text style={styles.statusUpdateText}>{option.label}</Text>
                            </TouchableOpacity>
                          ))
                        }
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrdersManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statusFilters: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#666',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  productsList: {
    marginBottom: 8,
  },
  productItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
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
    maxHeight: '80%',
  },
  modalContent: {
    maxHeight: '100%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
    flex: 1,
    textAlign: 'right',
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusUpdateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  statusUpdateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
