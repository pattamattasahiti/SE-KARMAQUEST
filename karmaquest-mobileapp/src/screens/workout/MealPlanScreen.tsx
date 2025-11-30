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
import { COLORS, SPACING, FONT_SIZES, DAYS_OF_WEEK } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

type NavigationProp = StackNavigationProp<WorkoutStackParamList>;

export default function MealPlanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, []);

  const loadMealPlan = async () => {
    try {
      console.log('[MealPlan] Loading current plan...');
      const response = await apiService.getCurrentMealPlan();
      console.log('[MealPlan] Response:', response);
      
      if (response.success && response.data) {
        // Extract plan from response - backend returns { plan: {...} }
        const planData = (response.data as any).plan || response.data;
        console.log('[MealPlan] ✅ Plan loaded:', planData);
        setPlan(planData);
      } else {
        // No plan exists
        console.log('[MealPlan] No plan found');
        setPlan(null);
      }
    } catch (error) {
      console.error('[MealPlan] ❌ Failed to load meal plan:', error);
      if (error instanceof Error) {
        console.error('[MealPlan] Error details:', error.message);
      }
      setPlan(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMealPlan();
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      console.log('[MealPlan] Generating new plan...');
      const response = await apiService.generateMealPlan();
      console.log('[MealPlan] Generate response:', response);
      
      if (response.success && response.data) {
        // Extract plan from response - backend returns { plan: {...} }
        const planData = (response.data as any).plan || response.data;
        console.log('[MealPlan] ✅ Plan generated:', planData);
        setPlan(planData);
        Alert.alert('Success', 'Your personalized 7-day meal plan has been generated!');
      } else {
        console.error('[MealPlan] ❌ Generate failed:', response);
        Alert.alert('Error', `Failed to generate meal plan: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[MealPlan] ❌ Exception during generation:', error);
      if (error instanceof Error) {
        console.error('[MealPlan] Error details:', error.message);
        Alert.alert('Error', `Failed to generate meal plan: ${error.message}`);
      } else {
        Alert.alert('Error', 'Failed to generate meal plan');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Meal Plan</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
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
        <Text style={styles.headerTitle}>My Meal Plan</Text>
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
            <Ionicons name="restaurant-outline" size={64} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
            <Text style={styles.emptyText}>
              Generate a personalized 7-day meal plan based on your fitness goals and activity level
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
                  <Text style={styles.generateButtonText}>Generate My Meal Plan</Text>
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
                  <Text style={styles.planTitle}>7-Day Meal Plan</Text>
                  <Text style={styles.planSubtitle}>
                    Personalized nutrition for your goals
                  </Text>
                  {(plan.plan_data?.[0]?.total_calories || plan.total_calories_per_day) && (
                    <View style={styles.caloriesBadge}>
                      <Ionicons name="flame" size={16} color={COLORS.error} />
                      <Text style={styles.caloriesText}>
                        {plan.plan_data?.[0]?.total_calories || plan.total_calories_per_day} cal/day
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={generateNewPlan}
                  disabled={generating}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            </Card>

            {/* Daily Meals */}
            {plan.plan_data && Array.isArray(plan.plan_data) && plan.plan_data.map((day: any, index: number) => (
              <Card key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayNumberBadge}>
                    <Text style={styles.dayNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.day}</Text>
                    {day.total_calories && (
                      <View style={styles.dayCalories}>
                        <Ionicons name="flame" size={14} color={COLORS.error} />
                        <Text style={styles.dayCaloriesText}>
                          {day.total_calories} cal
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {day.meals && day.meals.length > 0 ? (
                  <View style={styles.mealsList}>
                    {day.meals.map((meal: any, mealIndex: number) => (
                      <View key={mealIndex} style={styles.mealItem}>
                        <View style={styles.mealIcon}>
                          <Ionicons
                            name={
                              meal.meal_type === 'breakfast' ? 'sunny' :
                              meal.meal_type === 'lunch' ? 'partly-sunny' :
                              meal.meal_type === 'dinner' ? 'moon' : 'nutrition'
                            }
                            size={20}
                            color={COLORS.secondary}
                          />
                        </View>
                        <View style={styles.mealDetails}>
                          <Text style={styles.mealType}>
                            {(meal.meal_type || meal.type || 'meal').toUpperCase()}
                          </Text>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <View style={styles.macrosRow}>
                            <Text style={styles.macroText}>🔥 {meal.calories}cal</Text>
                            <Text style={styles.macroText}>💪 {meal.protein}g</Text>
                            <Text style={styles.macroText}>🍞 {meal.carbs}g</Text>
                            <Text style={styles.macroText}>🥑 {meal.fats}g</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noMeals}>
                    <Text style={styles.noMealsText}>No meals planned</Text>
                  </View>
                )}
              </Card>
            ))}

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
    backgroundColor: COLORS.secondary,
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
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 12,
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs,
  },
  caloriesText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.error,
  },
  regenerateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '20',
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
    backgroundColor: COLORS.secondary,
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
  dayCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  dayCaloriesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  mealsList: {
    gap: SPACING.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  mealDetails: {
    flex: 1,
  },
  mealType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: SPACING.xs / 2,
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
  noMeals: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  noMealsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
