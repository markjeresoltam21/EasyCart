import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SweetAlert from '../../utils/SweetAlert';
import SafeImage from '../../components/SafeImage';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

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

  const handleOpenFacebook = async () => {
    const url = 'https://www.facebook.com/markjere.gementiza';
    try {
      await Linking.openURL(url);
    } catch (error) {
      SweetAlert.error('Error', 'Could not open Facebook link');
    }
  };

  const settingsItems = [
    {
      title: 'Push Notifications',
      subtitle: 'Receive notifications for new orders and updates',
      icon: 'notifications-outline',
      type: 'switch',
      value: true,
      onPress: () => {},
    },
    {
      title: 'Email Alerts',
      subtitle: 'Receive email notifications for important events',
      icon: 'mail-outline',
      type: 'switch',
      value: true,
      onPress: () => {},
    },
    {
      title: 'Auto Backup',
      subtitle: 'Automatically backup data to cloud',
      icon: 'cloud-upload-outline',
      type: 'switch',
      value: false,
      onPress: () => {},
    },
    {
      title: 'Clear Cache',
      subtitle: 'Clear temporary files and cached data',
      icon: 'trash-outline',
      type: 'action',
      onPress: () => {},
    },
    {
      title: 'Help Center',
      subtitle: 'Get help and find answers',
      icon: 'help-circle-outline',
      type: 'action',
      onPress: () => {},
    },
    {
      title: 'Contact Support',
      subtitle: 'Get in touch with the developer',
      icon: 'mail-outline',
      type: 'action',
      onPress: () => {
        SweetAlert.custom(
          '📞 Contact Support',
          'How would you like to contact the developer?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: '📧 Email',
              onPress: () => {
                Linking.openURL('mailto:markjeresoltam@gmail.com?subject=EasyCart Support Request');
                SweetAlert.success('Opening Email', 'Email client will open shortly');
              }
            },
            {
              text: '📘 Facebook',
              onPress: () => {
                handleOpenFacebook();
                SweetAlert.success('Opening Facebook', 'Facebook will open shortly');
              }
            }
          ]
        );
      },
    },
    {
      title: 'Rate App',
      subtitle: 'Rate EasyCart on the App Store',
      icon: 'star-outline',
      type: 'action',
      onPress: () => {},
    },
  ];

  const renderSettingItem = (item, index) => {
    return (
      <TouchableOpacity
        key={index}
        style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name={item.icon} size={20} color="#ffffff" />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
            thumbColor={item.value ? theme.colors.primary : theme.colors.textMuted}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.profileIconContainer}>
              <View style={styles.defaultProfileIcon}>
                <Text style={styles.profileInitial}>
                  {(user?.displayName || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>APP SETTINGS</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
            onPress={toggleTheme}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent }]}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={20} color="#ffffff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Switch to dark theme</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent + '80' }}
              thumbColor={isDarkMode ? theme.colors.accent : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>NOTIFICATIONS</Text>
          {settingsItems.slice(0, 2).map((item, index) => renderSettingItem(item, index))}
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>DATA & STORAGE</Text>
          {settingsItems.slice(2, 4).map((item, index) => renderSettingItem(item, index + 2))}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SUPPORT</Text>
          {settingsItems.slice(4).map((item, index) => renderSettingItem(item, index + 4))}
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>LEGAL</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="document-text-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Terms of Service</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Read our terms and conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: 'transparent' }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Learn how we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About Us Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ABOUT US</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.card, borderBottomColor: 'transparent' }]}
            onPress={() => setShowAboutModal(true)}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="information-circle-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>EasyCart</Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Developed by Mark Jere Soltam Ayala Gementiza</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                // Already on Settings screen
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

      {/* About Us Modal */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <TouchableOpacity
          style={styles.aboutModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAboutModal(false)}
        >
          <View style={[styles.aboutModal, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.aboutHeader}>
              <SafeImage 
                source={require('../../../assets/images/easycart.png')}
                fallbackIcon="storefront"
                style={styles.appIcon}
              />
            </View>

            <View style={styles.developerSection}>
              <View style={styles.developerInfo}>
                <View style={[styles.personIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <SafeImage
                    source={require('../../../assets/images/mjsag.jpg')}
                    fallbackIcon="person"
                    fallbackColor={theme.colors.primary}
                    style={styles.profileImage}
                    iconSize={20}
                    containerStyle={styles.personIcon}
                  />
                </View>
                <View style={styles.developerDetails}>
                  <Text style={[styles.developerName, { color: theme.colors.text }]}>
                    Mark Jere Soltam Ayala Gementiza
                  </Text>
                  <Text style={[styles.developerRole, { color: theme.colors.primary }]}>
                    Programmer
                  </Text>
                </View>
              </View>

              <View style={styles.educationInfo}>
                <View style={[styles.schoolIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <Ionicons name="school" size={20} color={theme.colors.secondary} />
                </View>
                <View style={styles.educationDetails}>
                  <Text style={[styles.studentLevel, { color: theme.colors.text }]}>
                    4th Year Student
                  </Text>
                  <Text style={[styles.schoolName, { color: theme.colors.textSecondary }]}>
                    Agusan del Sur State College of Agriculture and Technology
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contactSection}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
                Connect with the developer
              </Text>
              
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#1877F2' }]}
                  onPress={() => {
                    setShowAboutModal(false);
                    handleOpenFacebook();
                  }}
                >
                  <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#EA4335' }]}
                  onPress={() => {
                    setShowAboutModal(false);
                    Linking.openURL('mailto:markjeresoltam@gmail.com');
                  }}
                >
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  profileButton: {
    padding: 5,
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 15,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 2,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 18,
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
  aboutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  aboutModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  developerSection: {
    marginBottom: 24,
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  developerDetails: {
    flex: 1,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  developerRole: {
    fontSize: 14,
    fontWeight: '500',
  },
  educationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  educationDetails: {
    flex: 1,
  },
  studentLevel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SettingsScreen;