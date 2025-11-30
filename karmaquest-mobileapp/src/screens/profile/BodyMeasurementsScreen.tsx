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
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';
import { useAuth } from '../../store/AuthContext';

interface Props {
  navigation: any;
}

interface Measurement {
  id: string;
  label: string;
  key: string;
  unit: string;
  icon: string;
  placeholder: string;
  isProfileField: boolean;
}

export default function BodyMeasurementsScreen({ navigation }: Props) {
  const { profile, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [measurements, setMeasurements] = useState<{ [key: string]: string }>({
    current_weight: '',
    height: '',
    target_weight: '',
    chest: '',
    waist: '',
    hips: '',
    thigh: '',
    arm: '',
    calf: '',
    neck: '',
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setMeasurements(prev => ({
        ...prev,
        current_weight: profile.current_weight?.toString() || '',
        height: profile.height?.toString() || '',
        target_weight: profile.target_weight?.toString() || '',
      }));
    }
  }, [profile]);

  const measurementItems: Measurement[] = [
    { id: '1', label: 'Current Weight', key: 'current_weight', unit: 'kg', icon: 'scale', placeholder: '0.0', isProfileField: true },
    { id: '2', label: 'Height', key: 'height', unit: 'cm', icon: 'resize', placeholder: '0', isProfileField: true },
    { id: '3', label: 'Target Weight', key: 'target_weight', unit: 'kg', icon: 'flag', placeholder: '0.0', isProfileField: true },
    { id: '4', label: 'Chest', key: 'chest', unit: 'cm', icon: 'body', placeholder: '0', isProfileField: false },
    { id: '5', label: 'Waist', key: 'waist', unit: 'cm', icon: 'contract', placeholder: '0', isProfileField: false },
    { id: '6', label: 'Hips', key: 'hips', unit: 'cm', icon: 'ellipse', placeholder: '0', isProfileField: false },
    { id: '7', label: 'Thigh', key: 'thigh', unit: 'cm', icon: 'remove', placeholder: '0', isProfileField: false },
    { id: '8', label: 'Arm', key: 'arm', unit: 'cm', icon: 'fitness', placeholder: '0', isProfileField: false },
    { id: '9', label: 'Calf', key: 'calf', unit: 'cm', icon: 'walk', placeholder: '0', isProfileField: false },
    { id: '10', label: 'Neck', key: 'neck', unit: 'cm', icon: 'radio-button-on', placeholder: '0', isProfileField: false },
  ];

  const handleSave = async () => {
    // Check if at least one measurement is entered
    const hasData = Object.values(measurements).some(value => value.trim() !== '');
    
    if (!hasData) {
      Alert.alert('Error', 'Please enter at least one measurement');
      return;
    }

    setLoading(true);
    try {
      // Split measurements into profile fields and body measurements
      const profileFields: any = {};
      const bodyMeasurements: any = {};

      Object.entries(measurements).forEach(([key, value]) => {
        if (value.trim() !== '') {
          const parsedValue = parseFloat(value);
          if (key === 'current_weight' || key === 'height' || key === 'target_weight') {
            profileFields[key] = parsedValue;
          } else {
            bodyMeasurements[key] = parsedValue;
          }
        }
      });

      // Update profile if there are profile fields
      if (Object.keys(profileFields).length > 0) {
        const profileResponse = await apiService.updateUserProfile(profileFields);
        
        if (!profileResponse.success) {
          Alert.alert('Error', profileResponse.error || 'Failed to update profile');
          setLoading(false);
          return;
        }
      }

      // Log body measurements if there are any
      if (Object.keys(bodyMeasurements).length > 0) {
        const measurementResponse = await apiService.logMeasurements(bodyMeasurements);
        
        if (!measurementResponse.success) {
          Alert.alert('Error', measurementResponse.error || 'Failed to save body measurements');
          setLoading(false);
          return;
        }
      }

      // Refresh profile data in context
      await refreshUserData();
      
      Alert.alert('Success', 'Your measurements have been saved successfully!', [
        { 
          text: 'OK', 
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Failed to save measurements:', error);
      Alert.alert('Error', 'Failed to save measurements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMeasurement = (key: string, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Measurements</Text>
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
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.info} />
            <Text style={styles.infoTitle}>Tracking Tips</Text>
          </View>
          <Text style={styles.infoText}>
            • Measure at the same time of day for consistency{'\n'}
            • Take measurements before eating{'\n'}
            • Use a flexible tape measure{'\n'}
            • Stand relaxed in a natural position
          </Text>
        </Card>

        {/* Measurements */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Text style={styles.sectionDescription}>
            Weight, height, and target weight (shown in Your Stats)
          </Text>

          <View style={styles.measurementsGrid}>
            {measurementItems.filter(item => item.isProfileField).map((item) => (
              <View key={item.id} style={styles.measurementItem}>
                <View style={styles.measurementHeader}>
                  <View style={[styles.measurementIcon, { backgroundColor: COLORS.primary + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.measurementLabel}>{item.label}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={measurements[item.key]}
                    onChangeText={(value) => updateMeasurement(item.key, value)}
                    placeholder={item.placeholder}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.unit}>{item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Body Measurements */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Body Measurements (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Track specific body measurements for detailed progress
          </Text>

          <View style={styles.measurementsGrid}>
            {measurementItems.filter(item => !item.isProfileField).map((item) => (
              <View key={item.id} style={styles.measurementItem}>
                <View style={styles.measurementHeader}>
                  <View style={[styles.measurementIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.measurementLabel}>{item.label}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={measurements[item.key]}
                    onChangeText={(value) => updateMeasurement(item.key, value)}
                    placeholder={item.placeholder}
                    keyboardType="decimal-pad"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.unit}>{item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Measurement Guide */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement Guide</Text>
          
          <View style={styles.guideList}>
            <View style={styles.guideItem}>
              <Text style={styles.guideLabel}>Chest:</Text>
              <Text style={styles.guideText}>
                Measure around the fullest part of your chest, keeping the tape parallel to the floor
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideLabel}>Waist:</Text>
              <Text style={styles.guideText}>
                Measure around your natural waistline (above belly button)
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideLabel}>Hips:</Text>
              <Text style={styles.guideText}>
                Measure around the widest part of your hips and buttocks
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideLabel}>Arm:</Text>
              <Text style={styles.guideText}>
                Measure around the largest part of your upper arm (bicep)
              </Text>
            </View>
            <View style={styles.guideItem}>
              <Text style={styles.guideLabel}>Thigh:</Text>
              <Text style={styles.guideText}>
                Measure around the largest part of your thigh
              </Text>
            </View>
          </View>
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
  infoCard: {
    backgroundColor: COLORS.info + '10',
    borderColor: COLORS.info + '30',
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  measurementsGrid: {
    gap: SPACING.md,
  },
  measurementItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  measurementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  unit: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  guideList: {
    gap: SPACING.md,
  },
  guideItem: {
    flexDirection: 'column',
  },
  guideLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  guideText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
