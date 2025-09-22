import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { doc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { usePayment } from '../../context/PaymentContext';

const EditProductScreen = ({ navigation, route }) => {
  const { product } = route.params;
  const { theme } = useTheme();
  const { paymentMethods } = usePayment();
  
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [categoryId, setCategoryId] = useState(product.categoryId || '');
  const [categories, setCategories] = useState([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState(
    new Set(product.availablePaymentMethods || [])
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const fetchedCategories = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() });
      });
      
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    }
  };

  const pickImage = async () => {
    try {
      console.log('Starting image picker...');
      
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      console.log('Launching image picker...');
      // Launch image picker with correct MediaType
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false, // Don't include base64 data to improve performance
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Setting image URL:', result.assets[0].uri);
        setImageUrl(result.assets[0].uri);
        Alert.alert('Success', 'Image updated successfully!');
      } else {
        console.log('Image selection was canceled');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const togglePaymentMethod = (methodId) => {
    setSelectedPaymentMethods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(methodId)) {
        newSet.delete(methodId);
      } else {
        newSet.add(methodId);
      }
      return newSet;
    });
  };

  const getPaymentMethodIcon = (methodId) => {
    const iconMap = {
      'cod': 'cash-outline',
      'gcash': 'phone-portrait-outline',
      'paymaya': 'card-outline',
      'paypal': 'logo-paypal',
      'bank_transfer': 'business-outline'
    };
    return iconMap[methodId] || 'card-outline';
  };

  const getPaymentMethodColor = (methodId) => {
    const colorMap = {
      'cod': '#28a745',
      'gcash': '#007bff',
      'paymaya': '#00d4aa',
      'paypal': '#0070ba',
      'bank_transfer': '#6c757d'
    };
    return colorMap[methodId] || '#6c757d';
  };

  const handleUpdateProduct = async () => {
    if (!name || !description || !price || !stock || !categoryId) {
      Alert.alert('Error', 'Please fill in all required fields including category');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return;
    }

    setLoading(true);
    try {
      // Convert Set to Array for Firestore storage
      const availablePaymentMethods = selectedPaymentMethods.size > 0 
        ? Array.from(selectedPaymentMethods) 
        : paymentMethods.filter(method => method.enabled).map(method => method.id); // Default to all enabled methods

      await updateDoc(doc(db, 'products', product.id), {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock: stockNum,
        categoryId: categoryId,
        imageUrl: imageUrl,
        availablePaymentMethods: availablePaymentMethods,
        updatedAt: new Date(),
      });

      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Product Name *"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Product Description *"
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={categoryId}
              onValueChange={(itemValue) => setCategoryId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a category..." value="" />
              {categories.map((category) => (
                <Picker.Item
                  key={category.id}
                  label={category.name}
                  value={category.id}
                />
              ))}
            </Picker>
          </View>

          {/* Payment Methods Section */}
          <Text style={styles.sectionTitle}>Available Payment Methods</Text>
          <Text style={styles.sectionSubtitle}>
            Select which payment methods customers can use for this product. If none selected, all enabled methods will be available.
          </Text>
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.filter(method => method.enabled).map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodItem,
                  selectedPaymentMethods.has(method.id) && styles.paymentMethodSelected
                ]}
                onPress={() => togglePaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodIconContainer}>
                  <Ionicons 
                    name={getPaymentMethodIcon(method.id)} 
                    size={24} 
                    color={selectedPaymentMethods.has(method.id) ? getPaymentMethodColor(method.id) : '#999'} 
                  />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodName,
                    selectedPaymentMethods.has(method.id) && styles.paymentMethodNameSelected
                  ]}>
                    {method.name}
                  </Text>
                  <Text style={styles.paymentMethodDescription}>
                    {method.description}
                  </Text>
                </View>
                <View style={styles.paymentMethodCheckbox}>
                  <Ionicons 
                    name={selectedPaymentMethods.has(method.id) ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={28} 
                    color={selectedPaymentMethods.has(method.id) ? getPaymentMethodColor(method.id) : '#999'} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Price *"
              placeholderTextColor={theme.colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Stock Quantity *"
              placeholderTextColor={theme.colors.textMuted}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleUpdateProduct}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Updating Product...' : 'Update Product'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    backgroundColor: '#2e78b7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  paymentMethodsContainer: {
    marginBottom: 20,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f8fbff',
  },
  paymentMethodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodCheckbox: {
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodNameSelected: {
    color: '#007AFF',
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default EditProductScreen;