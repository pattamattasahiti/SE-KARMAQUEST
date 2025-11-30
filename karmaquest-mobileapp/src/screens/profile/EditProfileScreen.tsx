import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

interface Props {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: Props) {
  const { user, profile, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [currentWeight, setCurrentWeight] = useState(profile?.current_weight?.toString() || '');
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() || '');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    (profile?.fitness_level as 'beginner' | 'intermediate' | 'advanced') || 'beginner'
  );
  
  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setLoading(true);
    try {
      // Update profile data
      const profileData = {
        height: height ? parseFloat(height) : null,
        current_weight: currentWeight ? parseFloat(currentWeight) : null,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        fitness_level: fitnessLevel,
      };

      const response = await apiService.updateUserProfile(profileData);
      
      if (response.success) {
        // Reload user profile
        await refreshUserData();
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Personal Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </Card>

        {/* Body Measurements */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter height in cm"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder="Enter current weight"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="Enter target weight"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </Card>

        {/* Fitness Level */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Level</Text>
          
          <View style={styles.optionsContainer}>
            {fitnessLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  fitnessLevel === level && styles.optionButtonActive,
                ]}
                onPress={() => setFitnessLevel(level as 'beginner' | 'intermediate' | 'advanced')}
              >
                <View style={[
                  styles.radioOuter,
                  fitnessLevel === level && styles.radioOuterActive,
                ]}>
                  {fitnessLevel === level && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.optionText,
                  fitnessLevel === level && styles.optionTextActive,
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* BMI Calculator */}
        {height && currentWeight && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Body Mass Index (BMI)</Text>
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiValue}>
                {(parseFloat(currentWeight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}
              </Text>
              <Text style={styles.bmiLabel}>BMI</Text>
              <Text style={styles.bmiCategory}>
                {getBMICategory(parseFloat(currentWeight) / Math.pow(parseFloat(height) / 100, 2))}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
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
  saveButton: {
    padding: SPACING.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
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
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textSecondary,
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  optionButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionTextActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  bmiContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bmiLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  bmiCategory: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.success,
  },
});
