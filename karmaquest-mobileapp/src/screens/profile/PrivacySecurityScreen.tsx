import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';

interface Props {
  navigation: any;
}

export default function PrivacySecurityScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Privacy settings
  const [profileVisible, setProfileVisible] = useState(true);
  const [shareProgress, setShareProgress] = useState(false);
  const [shareWorkouts, setShareWorkouts] = useState(false);
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      Alert.alert('Success', 'Password changed successfully');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Please type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: () => {
                    // Handle account deletion
                    Alert.alert('Account Deleted', 'Your account has been deleted');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'We will prepare your data and send a download link to your email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Export Requested', `Export link will be sent to ${user?.email}`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Security */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>Add an extra layer of security</Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={twoFactorEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print" size={24} color={COLORS.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Biometric Login</Text>
                <Text style={styles.settingDescription}>Use fingerprint or face ID</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={biometricEnabled ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPasswordChange(!showPasswordChange)}
          >
            <Ionicons name="key" size={24} color={COLORS.warning} />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Ionicons 
              name={showPasswordChange ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>

          {showPasswordChange && (
            <View style={styles.passwordChangeContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={styles.helperText}>Must be at least 8 characters</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Privacy Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye" size={24} color={COLORS.info} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Profile Visibility</Text>
                <Text style={styles.settingDescription}>Make your profile visible to others</Text>
              </View>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={profileVisible ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="stats-chart" size={24} color={COLORS.success} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Share Progress</Text>
                <Text style={styles.settingDescription}>Allow others to see your progress</Text>
              </View>
            </View>
            <Switch
              value={shareProgress}
              onValueChange={setShareProgress}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={shareProgress ? COLORS.primary : COLORS.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="fitness" size={24} color={COLORS.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Share Workouts</Text>
                <Text style={styles.settingDescription}>Share workout details publicly</Text>
              </View>
            </View>
            <Switch
              value={shareWorkouts}
              onValueChange={setShareWorkouts}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={shareWorkouts ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
        </Card>

        {/* Data Management */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <Ionicons name="download" size={24} color={COLORS.info} />
            <Text style={styles.actionButtonText}>Export My Data</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Data management features will be available soon')}
          >
            <Ionicons name="trash" size={24} color={COLORS.warning} />
            <Text style={styles.actionButtonText}>Clear App Data</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Legal */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here')}
          >
            <Ionicons name="document-text" size={24} color={COLORS.textSecondary} />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service content will be displayed here')}
          >
            <Ionicons name="document-text" size={24} color={COLORS.textSecondary} />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.section, styles.dangerZone]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="warning" size={24} color={COLORS.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  passwordChangeContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  dangerZone: {
    borderWidth: 2,
    borderColor: COLORS.error + '30',
    backgroundColor: COLORS.error + '05',
  },
  dangerTitle: {
    color: COLORS.error,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.error,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  dangerButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.error,
  },
  dangerDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
