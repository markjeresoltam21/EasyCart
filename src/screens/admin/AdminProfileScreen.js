import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

const AdminProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    profilePicture: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        profilePicture: user.profilePicture || '',
      });
    }
  }, [user]);

  // Simple image picker like AddProductScreen
  const pickImage = async () => {
    if (uploading) return;

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false, // Don't include base64 data to improve performance
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        try {
          const imageUrl = result.assets[0].uri;
          console.log('Setting image URL:', imageUrl);
          
          setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
          
          // Update Firestore - properly define the document reference
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            profilePicture: imageUrl,
            updatedAt: new Date(),
          });
          
          // Update auth context
          if (updateUserProfile) {
            await updateUserProfile({ profilePicture: imageUrl });
          }
          
          Alert.alert('Success! 🎉', 'Profile picture updated successfully!');
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', `Failed to update profile picture: ${error.message}`);
        } finally {
          setUploading(false);
        }
      } else {
        console.log('Image selection was canceled');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        bio: formData.bio.trim(),
        updatedAt: new Date(),
      });

      // Update auth context if needed
      if (updateUserProfile) {
        await updateUserProfile(formData);
      }

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // Dynamic styles based on theme
  const getStyles = () => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    editButton: {
      padding: 8,
    },
    profileSection: {
      flex: 1,
    },
    profilePictureSection: {
      backgroundColor: theme.colors.card,
      marginBottom: 20,
      paddingVertical: 30,
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    imageContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 15,
    },
    profileImage: {
      width: '100%',
      height: '100%',
      borderRadius: 58,
    },
    imagePlaceholder: {
      alignItems: 'center',
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
    },
    imagePlaceholderText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 58,
    },
    uploadingText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 4,
    },
    roleText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    formContainer: {
      padding: 20,
      backgroundColor: theme.colors.card,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    },
    readOnlyInput: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.textSecondary,
    },
    textArea: {
      height: 100,
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    infoSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 16,
      marginTop: 20,
    },
    infoSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    actionButtons: {
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    cancelButton: {
      backgroundColor: theme.colors.textSecondary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const dynamicStyles = getStyles();

  return (
    <View style={dynamicStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Admin Profile</Text>
        <TouchableOpacity
          style={dynamicStyles.editButton}
          onPress={() => editing ? handleSave() : setEditing(true)}
        >
          <Ionicons 
            name={editing ? "checkmark" : "create-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={dynamicStyles.profileSection}>
        {/* Profile Picture Section - Same format as AddProductScreen */}
        <View style={dynamicStyles.profilePictureSection}>
          <Text style={dynamicStyles.sectionTitle}>Profile Picture</Text>
          <TouchableOpacity style={dynamicStyles.imageContainer} onPress={pickImage}>
            {formData.profilePicture ? (
              <Image source={{ uri: formData.profilePicture }} style={dynamicStyles.profileImage} />
            ) : (
              <View style={dynamicStyles.imagePlaceholder}>
                <View style={dynamicStyles.avatarPlaceholder}>
                  <Text style={dynamicStyles.avatarText}>
                    {(formData.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'A'}
                  </Text>
                </View>
                <Text style={dynamicStyles.imagePlaceholderText}>Tap to add profile picture</Text>
              </View>
            )}
            {uploading && (
              <View style={dynamicStyles.uploadingOverlay}>
                <Ionicons name="hourglass-outline" size={24} color="#007AFF" />
                <Text style={dynamicStyles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={dynamicStyles.roleText}>Administrator</Text>
        </View>

        <View style={dynamicStyles.formContainer}>
          {/* Display Name */}
          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.formLabel}>Display Name</Text>
            <TextInput
              style={[dynamicStyles.formInput, !editing && dynamicStyles.readOnlyInput]}
              value={formData.displayName}
              onChangeText={(text) => setFormData({...formData, displayName: text})}
              editable={editing}
              placeholder="Enter your display name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Email (Read-only) */}
          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.formLabel}>Email Address</Text>
            <TextInput
              style={[dynamicStyles.formInput, dynamicStyles.readOnlyInput]}
              value={formData.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={dynamicStyles.helperText}>Email cannot be changed</Text>
          </View>

          {/* Phone Number */}
          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.formLabel}>Phone Number</Text>
            <TextInput
              style={[dynamicStyles.formInput, !editing && dynamicStyles.readOnlyInput]}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
              editable={editing}
              placeholder="Enter your phone number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Bio */}
          <View style={dynamicStyles.formGroup}>
            <Text style={dynamicStyles.formLabel}>Bio</Text>
            <TextInput
              style={[dynamicStyles.formInput, dynamicStyles.textArea, !editing && dynamicStyles.readOnlyInput]}
              value={formData.bio}
              onChangeText={(text) => setFormData({...formData, bio: text})}
              editable={editing}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Account Information */}
          <View style={dynamicStyles.infoSection}>
            <Text style={dynamicStyles.infoSectionTitle}>Account Information</Text>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Account Type:</Text>
              <Text style={dynamicStyles.infoValue}>Administrator</Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>User ID:</Text>
              <Text style={dynamicStyles.infoValue}>{user?.uid || 'N/A'}</Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Created:</Text>
              <Text style={dynamicStyles.infoValue}>
                {user?.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : 'N/A'
                }
              </Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>Last Sign In:</Text>
              <Text style={dynamicStyles.infoValue}>
                {user?.metadata?.lastSignInTime 
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>
      </View>

      {editing && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setEditing(false);
              // Reset form data
              setFormData({
                displayName: user.displayName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                bio: user.bio || '',
                profilePicture: user.profilePicture || '',
              });
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    flex: 1,
  },
  // Profile Picture Section Styles (like AddProductScreen)
  profilePictureSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 58,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 58,
  },
  uploadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
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
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  textArea: {
    height: 100,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminProfileScreen;