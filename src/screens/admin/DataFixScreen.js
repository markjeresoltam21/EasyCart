import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { cleanupInvalidOrders, migrateOrdersToProducts, calculateUserStats } from '../../utils/fixDataScript';
import { verifyDataState } from '../../utils/verifyData';
import { useTheme } from '../../context/ThemeContext';

export default function DataFixScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleCleanupInvalidOrders = async () => {
    Alert.alert(
      'Remove Invalid Orders',
      'This will permanently delete orders that reference non-existent products. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Invalid Orders', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('Starting cleanup of invalid orders...');
              const result = await cleanupInvalidOrders();
              
              setResults(result);
              Alert.alert(
                'Cleanup Complete!',
                `Removed ${result.invalidOrdersRemoved} invalid orders.\n\nValid orders remaining: ${result.validOrders}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', `Failed to cleanup orders: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleMigrateOrders = async () => {
    setLoading(true);
    try {
      console.log('Starting migration of orders and products...');
      const result = await migrateOrdersToProducts();
      
      setResults(result);
      Alert.alert(
        'Migration Complete!',
        `Migrated ${result.migratedOrders} orders\nCreated ${result.createdProducts} new products`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to migrate data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateStats = async () => {
    setLoading(true);
    try {
      console.log('Calculating user stats...');
      const stats = await calculateUserStats();
      
      console.log('User stats calculated:', stats);
      Alert.alert(
        'Stats Calculated!',
        'Check console for detailed user statistics',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to calculate stats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyData = async () => {
    setLoading(true);
    try {
      console.log('Verifying current data state...');
      const report = await verifyDataState();
      
      Alert.alert(
        'Data State Report',
        `Orders: ${report.orders.total}\nProducts: ${report.products.total}\nUsers: ${report.users.total}\nMissing Products: ${report.productReferences.missingCount}\n\nCheck console for details`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', `Failed to verify data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Data Migration & Cleanup</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>� Check Current Data State</Text>
        <Text style={styles.description}>
          See how many orders, products, and users you have, and identify missing product references.
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]}
          onPress={handleVerifyData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Data State</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>�🔧 Create Missing Products</Text>
        <Text style={styles.description}>
          This will analyze orders with missing product references and create the missing products automatically. This preserves all your existing orders.
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleMigrateOrders}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Migrate & Create Products</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗑️ Remove Invalid Orders</Text>
        <Text style={styles.description}>
          This will permanently delete orders that reference products that don't exist. Use this if you want to clean up old/test orders.
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={handleCleanupInvalidOrders}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Remove Invalid Orders</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Calculate User Stats</Text>
        <Text style={styles.description}>
          This will recalculate order counts and spending totals for all users in the User Management screen.
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCalculateStats}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text style={[styles.buttonText, { color: '#666' }]}>Calculate User Statistics</Text>
          )}
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results</Text>
          <View style={styles.resultsContainer}>
            {results.migratedOrders !== undefined && (
              <>
                <Text style={styles.resultText}>Orders Migrated: {results.migratedOrders}</Text>
                <Text style={styles.resultText}>Products Created: {results.createdProducts}</Text>
              </>
            )}
            {results.invalidOrdersRemoved !== undefined && (
              <>
                <Text style={styles.resultText}>Invalid Orders Removed: {results.invalidOrdersRemoved}</Text>
                <Text style={styles.resultText}>Valid Orders Remaining: {results.validOrders}</Text>
              </>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.warningText}>
          ⚠️ Recommendation: Use "Migrate & Create Products" first to keep all orders. Only use "Remove Invalid Orders" if you want to delete old test data.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  infoButton: {
    backgroundColor: '#17A2B8',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultsContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});