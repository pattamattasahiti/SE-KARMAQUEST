import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList, WorkoutSession } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';
import { formatDuration, dateUtils } from '../../utils';

type NavigationProp = StackNavigationProp<WorkoutStackParamList, 'WorkoutHome'>;

export default function WorkoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const response = await apiService.getWorkoutHistory(10);
      if (response.success && response.data) {
        const sessions = (response.data as any).sessions || [];
        
        // Map backend fields to frontend expected fields
        const mappedSessions = sessions.map((session: any) => ({
          ...session,
          id: session.session_id,
          start_time: session.session_date,
          actual_duration: session.duration_seconds || 0,
          calories_burned: session.total_calories || 0,
          form_score: session.avg_posture_score || 0
        }));
        
        setWorkoutHistory(mappedSessions);
      }
    } catch (error) {
      console.error('Failed to load workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to format exercise name
  const formatExerciseName = (name: string): string => {
    if (!name) return 'Exercise';
    // Convert from snake_case or kebab-case to Title Case
    return name
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get display name for workout
  const getWorkoutDisplayName = (session: any): string => {
    // If it's an AI-Video workout and has a primary_exercise, show that
    if (session.workout_type === 'AI-Video' && session.primary_exercise) {
      return formatExerciseName(session.primary_exercise);
    }
    // Otherwise show the workout type
    return String(session.workout_type || 'Workout');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkoutHistory();
  };

  const startQuickWorkout = () => {
    navigation.navigate('ExerciseSelection');
  };

  const viewWorkoutDetails = (sessionId: string) => {
    navigation.navigate('WorkoutSummary', { sessionId });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Start Card */}
        <Card style={styles.quickStartCard}>
          <View style={styles.quickStartContent}>
            <View>
              <Text style={styles.quickStartTitle}>Ready to Train?</Text>
              <Text style={styles.quickStartSubtitle}>
                Start a new workout session
              </Text>
            </View>
            <TouchableOpacity
              style={styles.startButton}
              onPress={startQuickWorkout}
            >
              <Ionicons name="play" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ExerciseSelection')}
          >
            <Ionicons name="add-circle" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>Custom Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Plans' as any)}
          >
            <Ionicons name="calendar" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>My Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ExerciseLibrary' as any)}
          >
            <Ionicons name="library" size={32} color={COLORS.info} />
            <Text style={styles.actionText}>Exercises</Text>
          </TouchableOpacity>
        </View>

        {/* Workout History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workoutHistory.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : workoutHistory.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="fitness-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>
                Start your first workout to see it here
              </Text>
            </Card>
          ) : (
            workoutHistory.map((session) => (
              <TouchableOpacity
                key={session.id || session.session_id}
                onPress={() => viewWorkoutDetails(session.id || session.session_id || '')}
              >
                <Card style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardIcon}>
                      <Ionicons name="barbell" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.historyCardInfo}>
                      <Text style={styles.historyCardTitle}>
                        {getWorkoutDisplayName(session)}
                      </Text>
                      <Text style={styles.historyCardDate}>
                        {dateUtils.formatDate(session.start_time || session.session_date)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.historyCardStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>
                        {formatDuration(Number(session.actual_duration || session.duration_seconds || 0))}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="flame-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>
                        {Number(session.calories_burned || session.total_calories || 0)} cal
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>
                        {Number(session.form_score || session.avg_posture_score || 0)}% form
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  quickStartCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary + '15',
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickStartTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  quickStartSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  startButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  historySection: {
    marginTop: SPACING.md,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: SPACING.md,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  historyCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  historyCardInfo: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  historyCardDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  historyCardStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
