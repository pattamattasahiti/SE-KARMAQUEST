import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, DAYS_OF_WEEK } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

type PlanType = 'workout' | 'meal';

interface WorkoutPlan {
  id: string;
  day: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    rest_seconds: number;
  }>;
}

interface MealPlan {
  id: string;
  day: string;
  meals: Array<{
    type: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
}

export default function PlansScreen({ route }: any) {
  const initialTab = route?.params?.initialTab || 'workout';
  const [activeTab, setActiveTab] = useState<PlanType>(initialTab as PlanType);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [activeTab]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      if (activeTab === 'workout') {
        const response = await apiService.getCurrentWorkoutPlan();
        if (response.success && response.data) {
          const planData = response.data as any;
          // Backend returns: { plan: { plan_data: { days: [...], fitness_level: '...', ... } } }
          const plan = planData.plan || planData;
          
          // For workout plan, days are inside plan_data.days
          let workoutPlanData = [];
          if (plan.plan_data && plan.plan_data.days) {
            workoutPlanData = plan.plan_data.days;
          } else if (Array.isArray(plan.plan_data)) {
            workoutPlanData = plan.plan_data;
          } else if (Array.isArray(plan)) {
            workoutPlanData = plan;
          }
          
          // Transform backend format to frontend format
          const transformedPlan = workoutPlanData.map((day: any) => ({
            id: day.date || `${day.day}-workout`,
            day: day.day_name || day.day,
            exercises: (day.exercises || []).map((ex: any) => ({
              name: ex.type || ex.name || 'Exercise',
              sets: ex.sets || 3,
              reps: ex.reps || ex.duration || 10,
              rest_seconds: ex.rest || ex.rest_seconds || 60,
            })),
          }));
          
          setWorkoutPlan(transformedPlan);
        } else {
          setWorkoutPlan([]);
        }
      } else {
        const response = await apiService.getCurrentMealPlan();
        if (response.success && response.data) {
          const planData = response.data as any;
          // Backend returns: { plan: { plan_data: [...], ... } }
          const mealPlanData = planData.plan?.plan_data || planData.plan_data || planData.plan || [];
          
          // Ensure mealPlanData is an array
          if (!Array.isArray(mealPlanData)) {
            setMealPlan([]);
            return;
          }
          
          // Transform backend format to frontend format
          const transformedPlan = mealPlanData.map((day: any) => ({
            id: day.date || `${day.day}-meal`,
            day: day.day,
            meals: (day.meals || []).map((meal: any) => ({
              type: meal.meal_type || meal.type || 'meal',
              name: meal.name,
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fats: meal.fats || 0,
            })),
          }));
          
          setMealPlan(transformedPlan);
        } else {
          setMealPlan([]);
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      if (activeTab === 'workout') {
        setWorkoutPlan([]);
      } else {
        setMealPlan([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    Alert.alert(
      'Generate New Plan',
      `Are you sure you want to generate a new ${activeTab} plan? This will replace your current plan.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(true);
            try {
              if (activeTab === 'workout') {
                const response = await apiService.generateWorkoutPlan();
                if (response.success) {
                  Alert.alert('Success', 'New workout plan generated!');
                  loadPlans();
                }
              } else {
                const response = await apiService.generateMealPlan();
                if (response.success) {
                  Alert.alert('Success', 'New meal plan generated!');
                  loadPlans();
                }
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to generate plan');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const renderWorkoutPlan = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (workoutPlan.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="barbell-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Workout Plan</Text>
          <Text style={styles.emptyText}>
            Generate a personalized workout plan based on your goals
          </Text>
          <TouchableOpacity style={styles.generateButton} onPress={generateNewPlan}>
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.generateButtonText}>Generate Plan</Text>
          </TouchableOpacity>
        </Card>
      );
    }

    return (
      <View style={styles.planContainer}>
        {DAYS_OF_WEEK.map((day, index) => {
          const dayPlan = workoutPlan.find((p) => p.day === day);
          
          return (
            <Card key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day}</Text>
                {dayPlan && (
                  <View style={styles.exerciseCount}>
                    <Text style={styles.exerciseCountText}>
                      {dayPlan.exercises?.length || 0} exercises
                    </Text>
                  </View>
                )}
              </View>
              {dayPlan ? (
                dayPlan.exercises?.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="fitness" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.restDayText}>Rest Day</Text>
              )}
            </Card>
          );
        })}
      </View>
    );
  };

  const renderMealPlan = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (mealPlan.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="restaurant-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Meal Plan</Text>
          <Text style={styles.emptyText}>
            Generate a personalized meal plan based on your goals
          </Text>
          <TouchableOpacity style={styles.generateButton} onPress={generateNewPlan}>
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.generateButtonText}>Generate Plan</Text>
          </TouchableOpacity>
        </Card>
      );
    }

    return (
      <View style={styles.planContainer}>
        {DAYS_OF_WEEK.map((day, index) => {
          const dayPlan = mealPlan.find((p) => p.day === day);
          
          return (
            <Card key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day}</Text>
                {dayPlan && (
                  <View style={styles.mealCount}>
                    <Text style={styles.mealCountText}>
                      {dayPlan.meals?.length || 0} meals
                    </Text>
                  </View>
                )}
              </View>
              {dayPlan?.meals?.map((meal, idx) => (
                <View key={idx} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealIcon}>
                      <Ionicons 
                        name={
                          meal.type === 'breakfast' ? 'sunny' :
                          meal.type === 'lunch' ? 'partly-sunny' :
                          meal.type === 'dinner' ? 'moon' : 'nutrition'
                        } 
                        size={20} 
                        color={COLORS.secondary} 
                      />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealType}>{meal.type.toUpperCase()}</Text>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <View style={styles.macrosRow}>
                        <Text style={styles.macroText}>🔥 {meal.calories}cal</Text>
                        <Text style={styles.macroText}>💪 {meal.protein}g</Text>
                        <Text style={styles.macroText}>🍞 {meal.carbs}g</Text>
                        <Text style={styles.macroText}>🥑 {meal.fats}g</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plans</Text>
        {(workoutPlan.length > 0 || mealPlan.length > 0) && (
          <TouchableOpacity onPress={generateNewPlan} disabled={generating}>
            {generating ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Ionicons name="refresh" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workout' && styles.tabActive]}
          onPress={() => setActiveTab('workout')}
        >
          <Ionicons 
            name="barbell" 
            size={20} 
            color={activeTab === 'workout' ? COLORS.white : COLORS.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'workout' && styles.tabTextActive]}>
            Workout Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meal' && styles.tabActive]}
          onPress={() => setActiveTab('meal')}
        >
          <Ionicons 
            name="restaurant" 
            size={20} 
            color={activeTab === 'meal' ? COLORS.white : COLORS.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'meal' && styles.tabTextActive]}>
            Meal Plan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'workout' ? renderWorkoutPlan() : renderMealPlan()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  planContainer: {
    gap: SPACING.md,
  },
  dayCard: {
    marginBottom: SPACING.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  exerciseCount: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  exerciseCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  mealCount: {
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  mealCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  exerciseDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  restDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  mealItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  mealName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  macroText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
