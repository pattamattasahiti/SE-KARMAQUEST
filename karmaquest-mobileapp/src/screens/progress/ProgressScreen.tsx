import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, CHART_COLORS } from '../../constants';
import { Card } from '../../components/common/Card';
import { LineChart } from 'react-native-chart-kit';
import apiService from '../../services/api';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [periodData, setPeriodData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
    loadAchievements();
  }, []);

  useEffect(() => {
    loadPeriodData();
  }, [selectedPeriod]);

  const loadProgressData = async () => {
    try {
      const response = await apiService.getProgressSummary();
      if (response.success && response.data) {
        setProgressData(response.data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPeriodData = async () => {
    try {
      const response = selectedPeriod === 'week' 
        ? await apiService.getWeeklyProgress()
        : await apiService.getMonthlyProgress();
      
      if (response.success && response.data) {
        setPeriodData(response.data);
      }
    } catch (error) {
      console.error('Failed to load period data:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const response = await apiService.getAchievements();
      if (response.success && response.data) {
        const data = response.data as any;
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProgressData();
    loadPeriodData();
    loadAchievements();
  };

  // Calculate chart data from real workout sessions
  const getChartData = () => {
    if (!periodData || !periodData.sessions || periodData.sessions.length === 0) {
      // Return empty data if no sessions
      return {
        calories: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(255, 101, 132, ${opacity})`, strokeWidth: 3 }],
        },
        duration: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`, strokeWidth: 3 }],
        }
      };
    }

    const sessions = periodData.sessions;
    const days = selectedPeriod === 'week' ? 7 : 30;
    const today = new Date();
    
    // Create arrays for the last 7 or 30 days
    const labels: string[] = [];
    const caloriesData: number[] = [];
    const durationData: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // For week view, show day names; for month view, show dates
      if (selectedPeriod === 'week') {
        labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]);
      } else {
        labels.push(`${date.getDate()}`);
      }
      
      // Find sessions for this date
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter((s: any) => {
        const sessionDate = new Date(s.session_date).toISOString().split('T')[0];
        return sessionDate === dateStr;
      });
      
      // Sum calories and duration for the day
      const dayCalories = daySessions.reduce((sum: number, s: any) => sum + (s.total_calories || 0), 0);
      const dayDuration = daySessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
      
      caloriesData.push(Math.round(dayCalories));
      durationData.push(Math.round(dayDuration / 60)); // Convert to minutes
    }

    // Show limited labels for month view
    const displayLabels = selectedPeriod === 'month' 
      ? labels.filter((_, i) => i % 5 === 0) // Show every 5th day
      : labels;

    return {
      calories: {
        labels: displayLabels,
        datasets: [{
          data: caloriesData.length > 0 ? caloriesData : [0],
          color: (opacity = 1) => `rgba(255, 101, 132, ${opacity})`,
          strokeWidth: 3,
        }],
      },
      duration: {
        labels: displayLabels,
        datasets: [{
          data: durationData.length > 0 ? durationData : [0],
          color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
          strokeWidth: 3,
        }],
      }
    };
  };

  const charts = getChartData();
  
  // Calculate formatted stats
  const totalWorkouts = progressData?.total_workouts || 0;
  const totalCalories = Math.round(progressData?.total_calories || 0);
  const totalTimeMinutes = periodData?.sessions?.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60 || 0;
  const totalTimeFormatted = totalTimeMinutes >= 60 
    ? `${(totalTimeMinutes / 60).toFixed(1)}h`
    : `${Math.round(totalTimeMinutes)}m`;
  const weightChange = progressData?.weight_change || 0;
  const weightChangeFormatted = weightChange > 0 ? `+${weightChange.toFixed(1)}kg` : `${weightChange.toFixed(1)}kg`;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textSecondary }}>Loading progress data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="flame-outline" size={28} color={COLORS.error} />
            <Text style={styles.statValue}>{totalCalories.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="barbell-outline" size={28} color={COLORS.primary} />
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={28} color={COLORS.success} />
            <Text style={styles.statValue}>{totalTimeFormatted}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="trending-down-outline" size={28} color={weightChange < 0 ? COLORS.success : COLORS.warning} />
            <Text style={styles.statValue}>{weightChangeFormatted}</Text>
            <Text style={styles.statLabel}>Weight Change</Text>
          </Card>
        </View>

        {/* Duration Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Workout Duration (minutes)</Text>
          <LineChart
            data={charts.duration}
            width={screenWidth - SPACING.md * 4}
            height={200}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: COLORS.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Calories Burned Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Calories Burned</Text>
          <LineChart
            data={charts.calories}
            width={screenWidth - SPACING.md * 4}
            height={200}
            chartConfig={{
              backgroundColor: COLORS.white,
              backgroundGradientFrom: COLORS.white,
              backgroundGradientTo: COLORS.white,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 101, 132, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: COLORS.secondary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* Recent Workouts with Trainer Feedback */}
        <Card style={styles.workoutHistoryCard}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {periodData?.sessions && periodData.sessions.length > 0 ? (
            periodData.sessions.slice(0, 5).map((session: any, index: number) => (
              <View key={session.session_id || index} style={styles.workoutHistoryItem}>
                <View style={styles.workoutHistoryHeader}>
                  <View style={styles.workoutDateContainer}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.workoutDate}>
                      {new Date(session.session_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  {session.avg_posture_score > 0 && (
                    <View style={[
                      styles.workoutScoreBadge,
                      { backgroundColor: session.avg_posture_score >= 80 ? COLORS.success : session.avg_posture_score >= 60 ? COLORS.warning : COLORS.error }
                    ]}>
                      <Text style={styles.workoutScoreText}>
                        {session.avg_posture_score.toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="fitness-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.workoutStatText}>{session.total_exercises} exercises</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.workoutStatText}>{Math.round(session.duration_seconds / 60)} min</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="flame-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.workoutStatText}>{Math.round(session.total_calories)} cal</Text>
                  </View>
                </View>

                {session.session_notes && session.session_notes.trim() && (
                  <View style={styles.trainerFeedbackContainer}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
                      <Text style={styles.feedbackHeaderText}>Trainer Feedback</Text>
                    </View>
                    <Text style={styles.feedbackText}>{session.session_notes}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.textSecondary} />
              <Text style={{ marginTop: SPACING.sm, color: COLORS.textSecondary }}>
                No workout history yet. Start your first workout!
              </Text>
            </View>
          )}
        </Card>

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.name}</Text>
                  <Text style={styles.achievementDate}>
                    {achievement.unlocked ? 'Unlocked!' : 'Locked'}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                )}
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
              <Ionicons name="ribbon-outline" size={48} color={COLORS.textSecondary} />
              <Text style={{ marginTop: SPACING.sm, color: COLORS.textSecondary }}>
                Complete workouts to unlock achievements!
              </Text>
            </View>
          )}
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
  achievementsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  achievementDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // Workout History Styles
  workoutHistoryCard: {
    marginBottom: SPACING.md,
  },
  workoutHistoryItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  workoutDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  workoutScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutScoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  workoutStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  trainerFeedbackContainer: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  feedbackHeaderText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  feedbackText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
});
