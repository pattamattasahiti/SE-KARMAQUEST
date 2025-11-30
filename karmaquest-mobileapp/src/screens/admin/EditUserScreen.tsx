import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { User } from '../../types';
import apiService from '../../services/api';

export const EditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = (route.params as any) || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      const response = await apiService.getUserDetails(userId);
      if (response.success && response.data) {
        const userData = (response.data as any).user;
        setUser(userData);
        setFormData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          is_active: userData.is_active !== false,
        });
      } else {
        Alert.alert('Error', 'User not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('Error', 'Failed to load user details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateUser(userId, formData);

      if (response.success) {
        Alert.alert('Success', 'User updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update user');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit User</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.roleSection}>
            <Text style={styles.label}>Role</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
              <Text style={styles.roleBadgeText}>{user.role?.toUpperCase() || 'USER'}</Text>
            </View>
          </View>
          <Text style={styles.infoText}>User ID: {user.user_id}</Text>
          <Text style={styles.infoText}>
            Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Edit Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>User Information</Text>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.first_name && styles.inputError]}
              value={formData.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              placeholder="Enter first name"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              editable={!saving}
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.last_name && styles.inputError]}
              value={formData.last_name}
              onChangeText={(value) => updateField('last_name', value)}
              placeholder="Enter last name"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
              editable={!saving}
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="user@example.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            <Text style={styles.helperText}>⚠️ Changing email may affect user login</Text>
          </View>

          {/* Account Status */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Account Active</Text>
              <Text style={styles.switchDescription}>
                {formData.is_active ? 'User can login and use the app' : 'User account is disabled'}
              </Text>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => updateField('is_active', value)}
              trackColor={{ false: COLORS.textSecondary, true: COLORS.success }}
              thumbColor={COLORS.white}
              disabled={saving}
            />
          </View>

          {/* Additional User Info (Read-only) */}
          {user.role === 'trainer' && user.trainer_specialization && (
            <View style={styles.infoSection}>
              <Text style={styles.label}>Trainer Specialization</Text>
              <Text style={styles.readOnlyText}>{user.trainer_specialization}</Text>
              <Text style={styles.helperText}>
                ℹ️ Edit specialization in trainer-specific settings
              </Text>
            </View>
          )}

          {user.role === 'trainer' && user.assigned_users && user.assigned_users.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.label}>Assigned Clients</Text>
              <Text style={styles.readOnlyText}>{user.assigned_users.length} clients</Text>
              <Text style={styles.helperText}>ℹ️ Manage assignments in trainer section</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const getRoleBadgeColor = (role?: string) => {
  switch (role) {
    case 'admin':
      return COLORS.error;
    case 'trainer':
      return COLORS.secondary;
    case 'user':
    default:
      return COLORS.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  form: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  infoSection: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  readOnlyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cancelButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
