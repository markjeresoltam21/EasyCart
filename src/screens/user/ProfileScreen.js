import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout, updateUserProfile } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
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
          
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            profilePicture: imageUrl,
            updatedAt: new Date(),
          });
          
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
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        updatedAt: new Date(),
      });

      if (updateUserProfile) {
        await updateUserProfile({
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
        });
      }

      Alert.alert('Success! 🎉', 'Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileModal(false);
      // Navigation will be handled by AuthContext
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      marginBottom: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    profileImage: {
      width: 114,
      height: 114,
      borderRadius: 57,
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    imagePlaceholderText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    uploadingOverlay: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 60,
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadingText: {
      marginTop: 5,
      fontSize: 12,
      color: '#007AFF',
    },
    roleText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    formContainer: {
      paddingHorizontal: 20,
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
      color: theme.colors.text,
      backgroundColor: theme.colors.card,
    },
    readOnlyInput: {
      backgroundColor: theme.colors.background,
      color: theme.colors.textSecondary,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    infoSection: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 10,
    },
    infoSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your account settings</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => editing ? handleSave() : setEditing(true)}
          >
            <Ionicons 
              name={editing ? "checkmark" : "create-outline"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Profile Section */}
      <ScrollView style={dynamicStyles.profileSection}>
        {/* Profile Picture Section */}
        <View style={dynamicStyles.profilePictureSection}>
          <Text style={dynamicStyles.sectionTitle}>Profile Picture</Text>
          <TouchableOpacity style={dynamicStyles.imageContainer} onPress={pickImage}>
            {formData.profilePicture ? (
              <Image source={{ uri: formData.profilePicture }} style={dynamicStyles.profileImage} />
            ) : (
              <View style={dynamicStyles.imagePlaceholder}>
                <View style={dynamicStyles.avatarPlaceholder}>
                  <Text style={dynamicStyles.avatarText}>
                    {(formData.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
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
          <Text style={dynamicStyles.roleText}>Customer</Text>
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
              <Text style={dynamicStyles.infoValue}>Customer</Text>
            </View>
            
            <View style={dynamicStyles.infoRow}>
              <Text style={dynamicStyles.infoLabel}>User ID:</Text>
              <Text style={dynamicStyles.infoValue}>{user?.uid?.slice(-12) || 'N/A'}</Text>
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
      </ScrollView>

      {editing && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.textMuted }]}
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
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editButton: {
    padding: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;