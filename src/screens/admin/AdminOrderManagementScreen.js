import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../context/OrderContext';
import { useTheme } from '../../context/ThemeContext';

const AdminOrderManagementScreen = ({ navigation }) => {
  const { allOrders, loading, updateOrderStatus, getOrderStats } = useOrders();
  const { theme, isDarkMode } = useTheme();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  
  const stats = getOrderStats();
  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setStatusModalVisible(false);
      setSelectedOrder(null);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const renderOrder = ({ item }) => (
    <View style={[styles.orderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: theme.colors.text }]}>Order #{item.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: theme.colors.text }]}>{item.customerInfo?.name || 'N/A'}</Text>
        <Text style={[styles.customerDetails, { color: theme.colors.textSecondary }]}>
          📞 {item.customerInfo?.phone || 'N/A'} • 📍 {item.customerInfo?.address || 'N/A'}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>{item.items?.length || 0} item(s)</Text>
        <Text style={styles.totalAmount}>₱{item.totalAmount?.toFixed(2) || '0.00'}</Text>
      </View>

      <View style={styles.paymentInfo}>
        <Text style={[styles.paymentMethod, { color: theme.colors.textSecondary }]}>
          💳 {item.paymentMethod?.name || item.customerInfo?.paymentMethod || 'N/A'}
        </Text>
        <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>{formatDate(item.createdAt)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.updateStatusButton, { backgroundColor: isDarkMode ? 'rgba(0, 122, 255, 0.1)' : '#f0f8ff' }]}
        onPress={() => {
          setSelectedOrder(item);
          setStatusModalVisible(true);
        }}
      >
        <Ionicons name="create-outline" size={16} color="#007AFF" />
        <Text style={styles.updateStatusText}>Update Status</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsCard = (title, value, color = '#007AFF') => (
    <View style={[styles.statsCard, { borderLeftColor: color, backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.statsValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statsLabel, { color: theme.colors.textSecondary }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {stats && (
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statsRow}>
            {renderStatsCard('Total', stats.total, '#34495e')}
            {renderStatsCard('Pending', stats.pending, '#f39c12')}
          </View>
          <View style={styles.statsRow}>
            {renderStatsCard('Processing', stats.processing, '#3498db')}
            {renderStatsCard('Delivered', stats.delivered, '#27ae60')}
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>₱{stats.totalRevenue.toLocaleString()}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={allOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        style={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No orders found</Text>
          </View>
        }
      />

      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Update Order Status</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Order #{selectedOrder?.id.slice(-6)}
            </Text>
            
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  { backgroundColor: isDarkMode ? theme.colors.surface : '#f8f9fa' },
                  selectedOrder?.status === status && styles.currentStatusOption
                ]}
                onPress={() => handleStatusUpdate(selectedOrder.id, status)}
              >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[
                  styles.statusOptionText,
                  { color: theme.colors.text },
                  selectedOrder?.status === status && styles.currentStatusText
                ]}>
                  {status}
                </Text>
                {selectedOrder?.status === status && (
                  <Text style={styles.currentLabel}>Current</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Will be overridden by theme in JSX
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 55,
  },
  statsContainer: {
    backgroundColor: '#fff', // Will be overridden by theme in JSX
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa', // Will be overridden by theme in JSX
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // Will be overridden by theme in JSX
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666', // Will be overridden by theme in JSX
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: 'white', // Will be overridden by theme in JSX
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Will be overridden by theme in JSX
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  customerInfo: {
    marginBottom: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  customerDetails: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  updateStatusText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 30,
    minWidth: 300,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  currentStatusOption: {
    backgroundColor: '#e7f3ff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  currentStatusText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  currentLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminOrderManagementScreen;