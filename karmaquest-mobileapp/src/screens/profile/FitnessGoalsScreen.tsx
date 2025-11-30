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

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function FitnessGoalsScreen({ navigation }: Props) {
  const { profile, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(profile?.fitness_goal || '');
  const [weeklyWorkouts, setWeeklyWorkouts] = useState('3');
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight?.toString() || '');
  const [targetDate, setTargetDate] = useState('');

  const goals: Goal[] = [
    {
      id: 'weight_loss',
      title: 'Weight Loss',
      description: 'Reduce body weight and burn fat',
      icon: 'trending-down',
      color: COLORS.error,
    },
    {
      id: 'muscle_gain',
      title: 'Muscle Gain',
      description: 'Build muscle mass and strength',
      icon: 'fitness',
      color: COLORS.success,
    },
    {
      id: 'general_fitness',
      title: 'General Fitness',
      description: 'Improve overall health and wellness',
      icon: 'heart',
      color: COLORS.primary,
    },
    {
      id: 'endurance',
      title: 'Endurance',
      description: 'Increase stamina and cardiovascular health',
      icon: 'speedometer',
      color: COLORS.info,
    },
    {
      id: 'flexibility',
      title: 'Flexibility',
      description: 'Improve range of motion and mobility',
      icon: 'body',
      color: COLORS.warning,
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      description: 'Maintain current fitness level',
      icon: 'checkmark-circle',
      color: COLORS.textSecondary,
    },
  ];

  const handleSave = async () => {
    if (!selectedGoal) {
      Alert.alert('Error', 'Please select a fitness goal');
      return;
    }

    if (!weeklyWorkouts || parseInt(weeklyWorkouts) < 1 || parseInt(weeklyWorkouts) > 7) {
      Alert.alert('Error', 'Weekly workouts must be between 1 and 7');
      return;
    }

    setLoading(true);
    try {
      const goalsData = {
        fitness_goal: selectedGoal,
        weekly_workout_goal: parseInt(weeklyWorkouts),
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      };

      const response = await apiService.updateUserGoals(goalsData);
      
      if (response.success) {
        await refreshUserData();
        Alert.alert('Success', 'Goals updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update goals');
      }
    } catch (error) {
      console.error('Failed to update goals:', error);
      Alert.alert('Error', 'Failed to update goals. Please try again.');
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
        <Text style={styles.headerTitle}>Fitness Goals</Text>
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
        {/* Primary Goal */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Primary Goal</Text>
          <Text style={styles.sectionDescription}>
            Choose the main fitness goal you want to achieve
          </Text>
          
          <View style={styles.goalsGrid}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoal === goal.id && styles.goalCardActive,
                ]}
                onPress={() => setSelectedGoal(goal.id)}
              >
                <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
                  <Ionicons name={goal.icon as any} size={32} color={goal.color} />
                </View>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                {selectedGoal === goal.id && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Weekly Workout Goal */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Workout Target</Text>
          <Text style={styles.sectionDescription}>
            How many days per week do you want to workout?
          </Text>
          
          <View style={styles.weeklyGoalContainer}>
            <View style={styles.daysSelector}>
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    parseInt(weeklyWorkouts) === day && styles.dayButtonActive,
                  ]}
                  onPress={() => setWeeklyWorkouts(day.toString())}
                >
                  <Text style={[
                    styles.dayButtonText,
                    parseInt(weeklyWorkouts) === day && styles.dayButtonTextActive,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.daysLabel}>
              {weeklyWorkouts} day{parseInt(weeklyWorkouts) !== 1 ? 's' : ''} per week
            </Text>
          </View>
        </Card>

        {/* Weight Goal (if applicable) */}
        {(selectedGoal === 'weight_loss' || selectedGoal === 'muscle_gain') && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Target Weight</Text>
            <Text style={styles.sectionDescription}>
              {selectedGoal === 'weight_loss' 
                ? 'What is your target weight?' 
                : 'What weight do you aim to reach?'}
            </Text>
            
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

            {targetWeight && profile?.current_weight && (
              <View style={styles.progressInfo}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Current</Text>
                  <Text style={styles.progressValue}>{profile.current_weight} kg</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={COLORS.textSecondary} />
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Target</Text>
                  <Text style={styles.progressValue}>{targetWeight} kg</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Change</Text>
                  <Text style={[
                    styles.progressValue,
                    { color: selectedGoal === 'weight_loss' ? COLORS.error : COLORS.success }
                  ]}>
                    {selectedGoal === 'weight_loss' ? '-' : '+'}
                    {Math.abs(parseFloat(targetWeight) - profile.current_weight).toFixed(1)} kg
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Recommendations */}
        <Card style={styles.section}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="bulb" size={24} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Recommendations</Text>
          </View>
          
          <View style={styles.recommendationList}>
            {selectedGoal === 'weight_loss' && (
              <>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Aim for 3-5 cardio sessions per week
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Maintain a caloric deficit of 300-500 calories/day
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Include strength training 2-3 times per week
                  </Text>
                </View>
              </>
            )}
            {selectedGoal === 'muscle_gain' && (
              <>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Focus on progressive overload in strength training
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Consume 1.6-2.2g protein per kg of body weight
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Get 7-9 hours of quality sleep for recovery
                  </Text>
                </View>
              </>
            )}
            {selectedGoal === 'general_fitness' && (
              <>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Mix cardio and strength training equally
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Stay active for at least 150 minutes per week
                  </Text>
                </View>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recommendationText}>
                    Maintain a balanced, nutritious diet
                  </Text>
                </View>
              </>
            )}
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  goalCard: {
    width: '48%',
    margin: SPACING.xs,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    position: 'relative',
  },
  goalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  goalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  goalDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  weeklyGoalContainer: {
    alignItems: 'center',
  },
  daysSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  dayButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayButtonTextActive: {
    color: COLORS.white,
  },
  daysLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
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
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  progressValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  recommendationList: {
    gap: SPACING.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
  },
});
