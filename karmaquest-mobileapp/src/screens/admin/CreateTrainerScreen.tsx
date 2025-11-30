import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import apiService from '../../services/api';

export const CreateTrainerScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    specialization: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTrainer = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.createTrainer(formData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Trainer account created successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create trainer account');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create trainer account'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Trainer Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.description}>
          Fill in the details below to create a new trainer account. The trainer will use the
          email and password to log in.
        </Text>

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
            editable={!loading}
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
            editable={!loading}
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
            editable={!loading}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Minimum 8 characters"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Specialization */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Specialization *</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.specialization && styles.inputError]}
            value={formData.specialization}
            onChangeText={(value) => updateField('specialization', value)}
            placeholder="e.g., Strength Training, Yoga, HIIT, Weight Loss"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!loading}
          />
          {errors.specialization && (
            <Text style={styles.errorText}>{errors.specialization}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateTrainer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="person-add" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Create Trainer Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  form: {
    padding: SPACING.lg,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
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
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
