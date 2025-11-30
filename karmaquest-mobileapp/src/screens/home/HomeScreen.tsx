import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../../components/common';
import { useAuth } from '../../store/AuthContext';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import apiService from '../../services/api';

export const HomeScreen = ({ navigation }: any) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [progressResponse, mealResponse] = await Promise.all([
        apiService.getProgressSummary(),
        apiService.getCurrentMealPlan()
      ]);
      
      if (progressResponse.success) {
        setStats(progressResponse.data);
      }
      
      if (mealResponse.success && mealResponse.data) {
        const planData = (mealResponse.data as any).plan || mealResponse.data;
        setMealPlan(planData);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.first_name}! 👋</Text>
          <Text style={styles.subGreeting}>Ready to crush your goals?</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {user?.profile_picture_url ? (
            <Image 
              source={{ uri: user.profile_picture_url }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialIcons name="person" size={24} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Card elevated style={styles.quickStatsCard}>
        <Text style={styles.cardTitle}>Today's Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.current_streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak 🔥</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_calories || 0}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.total_workouts || 0}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
        </View>
      </Card>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('Workout', { screen: 'WorkoutHome' })}
        >
          <MaterialIcons name="fitness-center" size={32} color={COLORS.surface} />
          <Text style={styles.actionButtonText}>Start Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
          onPress={() => navigation.navigate('Progress')}
        >
          <MaterialIcons name="trending-up" size={32} color={COLORS.surface} />
          <Text style={styles.actionButtonText}>View Progress</Text>
        </TouchableOpacity>
      </View>

      <Card elevated>
        <Text style={styles.cardTitle}>Your Workout Plan</Text>
        <Text style={styles.planSubtitle}>Week of {new Date().toLocaleDateString()}</Text>
        <TouchableOpacity
          style={styles.viewPlanButton}
          onPress={() => navigation.navigate('Workout', { 
            screen: 'WorkoutPlan'
          })}
        >
          <Text style={styles.viewPlanText}>View Full Plan</Text>
          <MaterialIcons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </Card>

      <Card elevated>
        <View style={styles.cardHeader}>
          <MaterialIcons name="restaurant" size={24} color={COLORS.secondary} />
          <Text style={styles.cardTitle}>Your Meal Plan</Text>
        </View>
        <Text style={styles.planSubtitle}>Personalized nutrition plan</Text>
        
        {mealPlan ? (
          <View style={styles.mealSummaryContainer}>
            <View style={styles.mealStatRow}>
              <View style={styles.mealStat}>
                <MaterialIcons name="local-fire-department" size={20} color={COLORS.error} />
                <Text style={styles.mealStatValue}>
                  {mealPlan.plan_data?.[0]?.total_calories || mealPlan.total_calories_per_day || 0}
                </Text>
                <Text style={styles.mealStatLabel}>cal/day</Text>
              </View>
              <View style={styles.mealStat}>
                <MaterialIcons name="restaurant-menu" size={20} color={COLORS.secondary} />
                <Text style={styles.mealStatValue}>
                  {mealPlan.plan_data?.[0]?.meals?.length || 4}
                </Text>
                <Text style={styles.mealStatLabel}>meals</Text>
              </View>
              <View style={styles.mealStat}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.info} />
                <Text style={styles.mealStatValue}>
                  {mealPlan.plan_data?.length || 7}
                </Text>
                <Text style={styles.mealStatLabel}>days</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noMealPlanContainer}>
            <Text style={styles.noMealPlanText}>
              No meal plan yet. Generate one now!
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.viewPlanButton, { backgroundColor: COLORS.secondary + '10' }]}
          onPress={() => navigation.navigate('Workout', { 
            screen: 'MealPlan'
          })}
        >
          <Text style={[styles.viewPlanText, { color: COLORS.secondary }]}>
            {mealPlan ? 'View Full Meal Plan' : 'Generate Meal Plan'}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  greeting: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text },
  subGreeting: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  profileButton: { /* Wrapper for profile avatar */ },
  profileImage: { 
    width: 40, 
    height: 40, 
    borderRadius: 20,
  },
  defaultAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsCard: { margin: SPACING.lg },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg, gap: SPACING.md },
  actionButton: { flex: 1, borderRadius: 16, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  actionButtonText: { color: COLORS.surface, fontSize: FONT_SIZES.md, fontWeight: '600', marginTop: SPACING.sm },
  planSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  viewPlanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  viewPlanText: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '600' },
  // Meal Plan Styles
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  mealSummaryContainer: { marginVertical: SPACING.md },
  mealStatRow: { flexDirection: 'row', justifyContent: 'space-around' },
  mealStat: { alignItems: 'center', gap: SPACING.xs },
  mealStatValue: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.xs / 2 },
  mealStatLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  noMealPlanContainer: { paddingVertical: SPACING.md },
  noMealPlanText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center' },
});
