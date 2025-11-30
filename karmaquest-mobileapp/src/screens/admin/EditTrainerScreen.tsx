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

export const EditTrainerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { trainerId } = (route.params as any) || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainer, setTrainer] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    is_active: true,
    trainer_specialization: '',
    assigned_users: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trainerId) {
      loadData();
    }
  }, [trainerId]);

  const loadData = async () => {
    try {
      // Load trainer details
      const trainerResponse = await apiService.getUserDetails(trainerId);
      if (trainerResponse.success && trainerResponse.data) {
        const trainerData = (trainerResponse.data as any).user;
        setTrainer(trainerData);
        setFormData({
          first_name: trainerData.first_name || '',
          last_name: trainerData.last_name || '',
          email: trainerData.email || '',
          is_active: trainerData.is_active !== false,
          trainer_specialization: trainerData.trainer_specialization || '',
          assigned_users: trainerData.assigned_users || [],
        });
      }

      // Load all users for assignment
      const usersResponse = await apiService.listUsers('user');
      if (usersResponse.success && usersResponse.data) {
        const data = usersResponse.data as any;
        setAllUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading trainer:', error);
      Alert.alert('Error', 'Failed to load trainer details');
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

    if (!formData.trainer_specialization.trim()) {
      newErrors.trainer_specialization = 'Specialization is required';
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
      // Update trainer info
      const response = await apiService.updateUser(trainerId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
        trainer_specialization: formData.trainer_specialization,
      });

      if (!response.success) {
        Alert.alert('Error', response.error || 'Failed to update trainer');
        setSaving(false);
        return;
      }

      // Update assigned clients
      const assignResponse = await apiService.assignClientsToTrainer(
        trainerId,
        formData.assigned_users
      );

      if (assignResponse.success) {
        Alert.alert('Success', 'Trainer updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Warning', 'Trainer updated but failed to update client assignments');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update trainer');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleClientAssignment = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter((id) => id !== userId)
        : [...prev.assigned_users, userId],
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!trainer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTextMain}>Trainer not found</Text>
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
        <Text style={styles.headerTitle}>Edit Trainer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Trainer Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.roleSection}>
            <Text style={styles.label}>Role</Text>
            <View style={[styles.roleBadge, { backgroundColor: COLORS.secondary }]}>
              <Text style={styles.roleBadgeText}>TRAINER</Text>
            </View>
          </View>
          <Text style={styles.infoText}>Trainer ID: {trainer.user_id}</Text>
          <Text style={styles.infoText}>
            Created: {trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Edit Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Trainer Information</Text>

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
              placeholder="trainer@example.com"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Specialization */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Specialization *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.trainer_specialization && styles.inputError,
              ]}
              value={formData.trainer_specialization}
              onChangeText={(value) => updateField('trainer_specialization', value)}
              placeholder="e.g., Strength Training, Yoga, HIIT, Weight Loss"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
            />
            {errors.trainer_specialization && (
              <Text style={styles.errorText}>{errors.trainer_specialization}</Text>
            )}
          </View>

          {/* Account Status */}
          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.label}>Account Active</Text>
              <Text style={styles.switchDescription}>
                {formData.is_active
                  ? 'Trainer can login and manage clients'
                  : 'Trainer account is disabled'}
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

          {/* Assign Clients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Assign Clients ({formData.assigned_users.length} selected)
            </Text>
            <Text style={styles.helperText}>
              Select users to assign to this trainer for personalized coaching
            </Text>

            {allUsers.length > 0 ? (
              <View style={styles.clientsList}>
                {allUsers.map((user) => (
                  <TouchableOpacity
                    key={user.user_id}
                    style={[
                      styles.clientItem,
                      formData.assigned_users.includes(user.user_id) && styles.clientItemSelected,
                    ]}
                    onPress={() => toggleClientAssignment(user.user_id)}
                    disabled={saving}
                  >
                    <View style={styles.clientInfo}>
                      <MaterialIcons
                        name={
                          formData.assigned_users.includes(user.user_id)
                            ? 'check-box'
                            : 'check-box-outline-blank'
                        }
                        size={24}
                        color={
                          formData.assigned_users.includes(user.user_id)
                            ? COLORS.primary
                            : COLORS.textSecondary
                        }
                      />
                      <View style={styles.clientDetails}>
                        <Text style={styles.clientName}>
                          {user.first_name} {user.last_name}
                        </Text>
                        <Text style={styles.clientEmail}>{user.email}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No users available to assign</Text>
              </View>
            )}
          </View>
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
  errorTextMain: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
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
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
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
  textArea: {
    height: 80,
    paddingTop: SPACING.md,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
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
  clientsList: {
    marginTop: SPACING.md,
  },
  clientItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clientItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  clientEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
