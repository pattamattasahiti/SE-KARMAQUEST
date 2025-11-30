import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

type NavigationProp = StackNavigationProp<WorkoutStackParamList>;

export default function WorkoutPlanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadWorkoutPlan();
  }, []);

  const loadWorkoutPlan = async () => {
    try {
      const response = await apiService.getCurrentWorkoutPlan();
      
      if (response.success && response.data) {
        // Backend returns { success: true, data: { plan: {...} } }
        const planData = (response.data as any).plan || response.data;
        setPlan(planData);
      } else {
        setPlan(null);
      }
    } catch (error) {
      console.error('[WorkoutPlan] Error loading plan:', error);
      setPlan(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkoutPlan();
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      console.log('[WorkoutPlan] Generating new plan...');
      const response = await apiService.generateWorkoutPlan();
      console.log('[WorkoutPlan] Generate response:', response);
      
      if (response.success && response.data) {
        // Extract plan from response - backend returns { plan: {...} }
        const planData = (response.data as any).plan || response.data;
        console.log('[WorkoutPlan] ✅ Plan generated:', planData);
        setPlan(planData);
        Alert.alert('Success', 'Your personalized 7-day workout plan has been generated!');
      } else {
        console.error('[WorkoutPlan] ❌ Generate failed:', response);
        Alert.alert('Error', `Failed to generate workout plan: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[WorkoutPlan] ❌ Exception during generation:', error);
      if (error instanceof Error) {
        console.error('[WorkoutPlan] Error details:', error.message);
        Alert.alert('Error', `Failed to generate workout plan: ${error.message}`);
      } else {
        Alert.alert('Error', 'Failed to generate workout plan');
      }
    } finally {
      setGenerating(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[(dayNumber - 1) % 7];
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Workout Plan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Workout Plan</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!plan ? (
          // No plan - show generate button
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No Workout Plan Yet</Text>
            <Text style={styles.emptyText}>
              Generate a personalized 7-day workout plan based on your fitness goals and progress
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateNewPlan}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={COLORS.white} />
                  <Text style={styles.generateButtonText}>Generate My Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            
           
            
            {/* Plan Header */}
            <Card style={styles.planHeaderCard}>
              <View style={styles.planHeaderContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>7-Day Workout Plan</Text>
                  <Text style={styles.planSubtitle}>
                    {plan.plan_data?.personalized 
                      ? `Personalized based on ${plan.plan_data.based_on_workouts || 0} workouts`
                      : 'Personalized for your goals'}
                  </Text>
                  {plan.plan_data?.fitness_level && (
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>
                        {plan.plan_data.fitness_level.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {plan.plan_data?.avg_form_score && (
                    <Text style={styles.formScoreText}>
                      Avg Form Score: {plan.plan_data.avg_form_score}%
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={generateNewPlan}
                  disabled={generating}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </Card>

            {/* Daily Workouts */}
            {plan.plan_data?.days && Array.isArray(plan.plan_data.days) && plan.plan_data.days.length > 0 ? (
              plan.plan_data.days.map((day: any, index: number) => (
                <Card key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumberBadge}>
                    <Text style={styles.dayNumber}>{day.day || index + 1}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>
                      {day.day_name || getDayName(day.day || index + 1)}
                    </Text>
                    {day.focus && (
                      <Text style={styles.dayFocus}>{day.focus}</Text>
                    )}
                    {day.estimated_duration_minutes > 0 && (
                      <Text style={styles.dayDuration}>
                        {day.estimated_duration_minutes} min workout
                      </Text>
                    )}
                  </View>
                </View>

                {day.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="information-circle" size={16} color={COLORS.info} />
                    <Text style={styles.notesText}>{day.notes}</Text>
                  </View>
                )}

                {day.exercises && day.exercises.length > 0 ? (
                  <View style={styles.exercisesList}>
                    {day.exercises.map((exercise: any, exIndex: number) => (
                      <View key={exIndex} style={styles.exerciseItem}>
                        <View style={styles.exerciseIcon}>
                          <Ionicons
                            name="fitness"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                        <View style={styles.exerciseDetails}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseTarget}>
                            {exercise.sets || 3} sets × {exercise.reps || 10} reps
                            {exercise.rest && ` • ${exercise.rest}s rest`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.restDay}>
                    <Ionicons name="bed-outline" size={32} color={COLORS.textSecondary} />
                    <Text style={styles.restDayText}>Rest Day</Text>
                    <Text style={styles.restDaySubtext}>Recovery is important!</Text>
                  </View>
                )}
              </Card>
            )))
            : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>No workout days found in plan</Text>
              </Card>
            )}

            {/* Regenerate Button at Bottom */}
            <TouchableOpacity
              style={styles.bottomGenerateButton}
              onPress={generateNewPlan}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={COLORS.white} />
                  <Text style={styles.bottomGenerateButtonText}>Generate New Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  planHeaderCard: {
    marginBottom: SPACING.md,
  },
  planHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  planSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 4,
    marginTop: SPACING.xs,
  },
  levelText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  formScoreText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: SPACING.xs / 2,
    fontWeight: '500',
  },
  regenerateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCard: {
    marginBottom: SPACING.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dayNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  dayNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  dayFocus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  dayDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.info + '10',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  notesText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 18,
  },
  exercisesList: {
    gap: SPACING.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  exerciseTarget: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  restDay: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  restDayText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  restDaySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bottomGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  bottomGenerateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
