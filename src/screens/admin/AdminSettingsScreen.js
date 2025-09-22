import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
  Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SweetAlert from '../../utils/SweetAlert';
import SafeImage from '../../components/SafeImage';

const AdminSettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleLogout = () => {
    SweetAlert.confirm(
      'Logout',
      'Are you sure you want to logout?',
      () => {
        logout();
        SweetAlert.success('Logged Out', 'You have been successfully logged out');
      }
    );
  };

  const handleClearCache = async () => {
    SweetAlert.confirm(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const cacheKeys = keys.filter(key => 
            key.startsWith('cache_') || key.startsWith('temp_')
          );
          await AsyncStorage.multiRemove(cacheKeys);
          SweetAlert.success('Success', 'Cache cleared successfully');
        } catch (error) {
          SweetAlert.error('Error', 'Failed to clear cache');
        }
      }
    );
  };

  const handleExportData = async () => {
    SweetAlert.confirm(
      'Export Data',
      'This feature will export your store data to CSV format.',
      () => {
        SweetAlert.info('Coming Soon', 'Data export feature will be available in the next update!');
      }
    );
  };

  const handleHelpCenter = () => {
    SweetAlert.info(
      'Help Center',
      'Welcome to EasyCart Help Center!\n\nFor support and documentation, please visit our website or contact our support team.'
    );
  };

  const handleContactSupport = () => {
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
  };

  const handlePrivacyPolicy = () => {
    SweetAlert.confirm(
      'Privacy Policy',
      'View our privacy policy online?',
      () => {
        Linking.openURL('https://easycart.com/privacy-policy');
        SweetAlert.success('Opening Browser', 'Privacy policy will open in your browser');
      }
    );
  };

  const handleTermsOfService = () => {
    SweetAlert.confirm(
      'Terms of Service',
      'View our terms of service online?',
      () => {
        Linking.openURL('https://easycart.com/terms-of-service');
        SweetAlert.success('Opening Browser', 'Terms of service will open in your browser');
      }
    );
  };

  const handleOpenFacebook = async () => {
    const url = 'https://www.facebook.com/markjere.gementiza';
    try {
      await Linking.openURL(url);
    } catch (error) {
      SweetAlert.error('Error', 'Could not open Facebook link');
    }
  };

  const handleRateApp = async () => {
    try {
      await Share.share({
        message: 'Check out EasyCart Admin - the best way to manage your online store!',
        title: 'EasyCart Admin',
      });
      SweetAlert.success('Thanks!', 'Thank you for sharing EasyCart!');
    } catch (error) {
      SweetAlert.error('Error', 'Unable to share app');
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.colors.card }]} 
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>NOTIFICATIONS</Text>
        
        <SettingItem
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Receive notifications for new orders and updates"
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={notifications ? theme.colors.primary : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
        
        <SettingItem
          icon="mail-outline"
          title="Email Alerts"
          subtitle="Receive email notifications for important events"
          rightComponent={
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={emailAlerts ? theme.colors.primary : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>APP SETTINGS</Text>
        
        <SettingItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Switch to dark theme"
          rightComponent={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
        
        <SettingItem
          icon="cloud-upload-outline"
          title="Auto Backup"
          subtitle="Automatically backup data to cloud"
          rightComponent={
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={autoBackup ? theme.colors.primary : '#f4f3f4'}
            />
          }
          showArrow={false}
        />
      </View>

      {/* Data & Storage Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>DATA & STORAGE</Text>
        
        <SettingItem
          icon="trash-outline"
          title="Clear Cache"
          subtitle="Clear temporary files and cached data"
          onPress={handleClearCache}
        />
        
        <SettingItem
          icon="download-outline"
          title="Export Data"
          subtitle="Export your store data to CSV"
          onPress={handleExportData}
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SUPPORT</Text>
        
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="Get help and find answers"
          onPress={handleHelpCenter}
        />
        
        <SettingItem
          icon="mail-outline"
          title="Contact Support"
          subtitle="Get in touch with our support team"
          onPress={handleContactSupport}
        />
        
        <SettingItem
          icon="star-outline"
          title="Rate App"
          subtitle="Rate EasyCart on the App Store"
          onPress={handleRateApp}
        />
      </View>

      {/* Legal Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>LEGAL</Text>
        
        <SettingItem
          icon="document-text-outline"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={handlePrivacyPolicy}
        />
        
        <SettingItem
          icon="document-text-outline"
          title="Terms of Service"
          subtitle="Read our terms of service"
          onPress={handleTermsOfService}
        />
      </View>

      {/* About Us Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ABOUT US</Text>
        
        <SettingItem
          icon="information-circle-outline"
          title="EasyCart"
          subtitle="Developed by Mark Jere Soltam Ayala Gementiza"
          onPress={() => setShowAboutModal(true)}
        />
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
        
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out of your admin account"
          onPress={handleLogout}
        />
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
          EasyCart Admin v1.0.0
        </Text>
      </View>
      </ScrollView>

      {/* About Us Modal */}
    <Modal
      visible={showAboutModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAboutModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
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
              <SafeImage 
                source={require('../../../assets/images/mjsag.jpg')}
                fallbackIcon="person"
                style={styles.profileImage}
              />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  },
  settingRight: {
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
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
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
});

export default AdminSettingsScreen;