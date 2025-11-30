import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WorkoutSession, ExerciseLog } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';
import { formatDuration, dateUtils } from '../../utils';
import { 
  WorkoutSummaryScreenNavigationProp, 
  WorkoutSummaryScreenRouteProp 
} from '../../navigation/types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

interface Props {
  navigation: CompositeNavigationProp<
    WorkoutSummaryScreenNavigationProp,
    BottomTabNavigationProp<any>
  >;
  route: WorkoutSummaryScreenRouteProp;
}

export default function WorkoutSummaryScreen({ route, navigation }: Props) {
  const { 
    sessionId, 
    aiAnalysis,
    videoUrl: routeVideoUrl,  // Video URL from navigation (AI workout completion)
    exerciseName,
    totalReps: aiTotalReps,
    duration: videoDuration,
    formScore,
    formIssues,
    formSuggestions,
    totalSets: aiTotalSets,
    caloriesBurned: aiCaloriesBurned
  } = route.params;
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(routeVideoUrl || null);
  const [displayFormScore, setDisplayFormScore] = useState<number | undefined>(formScore);
  const [displayFormIssues, setDisplayFormIssues] = useState<string[]>(formIssues || []);
  const [displayFormSuggestions, setDisplayFormSuggestions] = useState<string[]>(formSuggestions || []);
  const [displayExerciseName, setDisplayExerciseName] = useState<string | undefined>(exerciseName);

  // Video player for AI workout result - will be updated when session loads
  const player = useVideoPlayer(videoUrl || '', (player) => {
    player.loop = false;
  });

  // Update video player source when videoUrl changes
  useEffect(() => {
    if (videoUrl && player) {
      // Use replaceAsync instead of replace to avoid UI freezes on iOS
      if (player.replaceAsync) {
        player.replaceAsync(videoUrl).catch((error: any) => {
          console.error('[Summary] Error replacing video:', error);
        });
      } else {
        player.replace(videoUrl);
      }
    }
  }, [videoUrl]);

  useEffect(() => {
    loadWorkoutData();
    load7DayPlanPreview(); // Auto-load 7-day plan for demo
    loadMealPlanPreview(); // Auto-load meal plan
  }, []);

  const loadWorkoutData = async () => {
    try {
      const response = await apiService.getWorkoutSession(sessionId);
      if (response.success && response.data) {
        const data = response.data as any;
        const sessionData = data.session || data;
        
        // Map backend fields to frontend expected fields
        const mappedSession = {
          ...sessionData,
          start_time: sessionData.session_date || sessionData.start_time,
          actual_duration: sessionData.duration_seconds || sessionData.actual_duration || 0,
          notes: sessionData.session_notes || sessionData.notes,
          calories_burned: sessionData.total_calories || sessionData.calories_burned || 0,
          workout_type: sessionData.workout_type || 'General',
          video_url: sessionData.video_url  // Get video URL from backend
        };
        
        setSession(mappedSession);
        
        // If video URL exists in session and not passed via route, use it
        if (sessionData.video_url && !routeVideoUrl) {
          console.log('[Summary] Loading video from session:', sessionData.video_url);
          setVideoUrl(sessionData.video_url);
        }
        
        // Map exercise logs to expected format
        const mappedExercises = (sessionData.exercises || []).map((ex: any) => ({
          exercise_name: ex.exercise_type || ex.exercise_name,
          sets: ex.sets || 1, // Use backend value, fallback to 1
          reps: ex.total_reps || ex.reps || 0,
          weight: 0,
          form_score: ex.avg_form_score || ex.form_score || 0,
          posture_issues: ex.posture_issues || []
        }));
        
        setExercises(mappedExercises);
        
        // Extract AI analysis data from exercises if not provided via route
        if (!formScore && mappedExercises.length > 0 && sessionData.workout_type === 'AI-Video') {
          // Calculate average form score
          const avgFormScore = mappedExercises.reduce((sum: number, ex: any) => sum + (ex.form_score || 0), 0) / mappedExercises.length;
          setDisplayFormScore(Math.round(avgFormScore));
          
          // Extract exercise name
          if (mappedExercises[0].exercise_name) {
            setDisplayExerciseName(mappedExercises[0].exercise_name);
          }
          
          // Extract posture issues as form issues
          const allIssues = mappedExercises.flatMap((ex: any) => ex.posture_issues || []);
          if (allIssues.length > 0) {
            setDisplayFormIssues(allIssues);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const load7DayPlanPreview = async () => {
    setLoadingPlan(true);
    try {
      console.log('[Summary] Loading 7-day plan preview...');
      const response = await apiService.getCurrentWorkoutPlan();
      
      if (response.success && response.data) {
        console.log('[Summary] ✅ 7-day plan loaded:', response.data);
        // Extract plan from response
        const planData = (response.data as any).plan || response.data;
        setWeeklyPlan(planData);
      } else {
        // Generate new plan if none exists
        console.log('[Summary] No existing plan, generating new one...');
        const generateResponse = await apiService.generateWorkoutPlan();
        console.log('[Summary] Generate response:', generateResponse);
        
        if (generateResponse.success && generateResponse.data) {
          console.log('[Summary] ✅ Plan generated successfully');
          // Extract plan from response
          const planData = (generateResponse.data as any).plan || generateResponse.data;
          setWeeklyPlan(planData);
        } else {
          console.error('[Summary] ❌ Failed to generate plan:', generateResponse);
        }
      }
    } catch (error) {
      console.error('[Summary] ❌ Error in plan loading:', error);
      if (error instanceof Error) {
        console.error('[Summary] Error message:', error.message);
        console.error('[Summary] Error stack:', error.stack);
      }
    } finally {
      setLoadingPlan(false);
    }
  };

  const loadMealPlanPreview = async () => {
    setLoadingMealPlan(true);
    try {
      console.log('[Summary] Loading meal plan preview...');
      const response = await apiService.getCurrentMealPlan();
      
      if (response.success && response.data) {
        console.log('[Summary] ✅ Meal plan loaded:', response.data);
        // Extract plan from response
        const planData = (response.data as any).plan || response.data;
        setMealPlan(planData);
      } else {
        // Generate new meal plan if none exists
        console.log('[Summary] No existing meal plan, generating new one...');
        const generateResponse = await apiService.generateMealPlan();
        console.log('[Summary] Meal plan generate response:', generateResponse);
        
        if (generateResponse.success && generateResponse.data) {
          console.log('[Summary] ✅ Meal plan generated successfully');
          // Extract plan from response
          const planData = (generateResponse.data as any).plan || generateResponse.data;
          setMealPlan(planData);
        } else {
          console.error('[Summary] ❌ Failed to generate meal plan:', generateResponse);
          // Don't block the screen if generation fails
          setMealPlan(null);
        }
      }
    } catch (error) {
      console.error('[Summary] ❌ Error in meal plan loading:', error);
      if (error instanceof Error) {
        console.error('[Summary] Error message:', error.message);
      }
      // Don't block the screen if meal plan fails
      setMealPlan(null);
    } finally {
      setLoadingMealPlan(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load workout session</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const totalReps = exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
  const totalWeight = exercises.reduce((sum, ex) => sum + (ex.weight || 0) * (ex.sets || 0), 0);
  const duration = session.actual_duration || session.duration_seconds || 0;
  const caloriesBurned = session.calories_burned || session.total_calories || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.celebrationBadge}>
          <Ionicons name="trophy" size={60} color={COLORS.warning} />
        </View>
        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.subtitle}>Great job! Here's your summary</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* AI Video Playback - NEW! Show if videoUrl is present */}
        {videoUrl && (
          <Card style={styles.videoCard}>
            <View style={styles.videoHeader}>
              <Ionicons name="videocam" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>AI Analyzed Video</Text>
            </View>
            <View style={styles.videoContainer}>
              <VideoView
                style={styles.videoPlayer}
                player={player}
                nativeControls={true}
                contentFit="contain"
              />
            </View>
            {displayExerciseName && (
              <Text style={styles.videoExerciseName}>
                Exercise: <Text style={styles.videoExerciseValue}>{displayExerciseName}</Text>
              </Text>
            )}
          </Card>
        )}

        {/* Quick AI Stats - Show if coming from AI video workout or AI-Video session */}
        {(displayFormScore !== undefined || aiTotalReps !== undefined || session?.workout_type === 'AI-Video') && (
          <View style={styles.statsGrid}>
            {(aiTotalReps !== undefined || (session?.workout_type === 'AI-Video' && session?.total_reps)) && (
              <Card style={styles.statCard}>
                <Ionicons name="repeat" size={32} color={COLORS.success} />
                <Text style={styles.statValue}>{aiTotalReps || session?.total_reps || 0}</Text>
                <Text style={styles.statLabel}>AI Counted Reps</Text>
              </Card>
            )}
            {displayFormScore !== undefined && (
              <Card style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={32} color={
                  displayFormScore >= 80 ? COLORS.success :
                  displayFormScore >= 60 ? COLORS.warning : COLORS.error
                } />
                <Text style={styles.statValue}>{displayFormScore}</Text>
                <Text style={styles.statLabel}>Form Score</Text>
              </Card>
            )}
          </View>
        )}

        {/* Stats Overview - Regular session stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{formatDuration(videoDuration || duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="flame-outline" size={32} color={COLORS.error} />
            <Text style={styles.statValue}>{aiCaloriesBurned || caloriesBurned}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="fitness-outline" size={32} color={COLORS.success} />
            <Text style={styles.statValue}>{aiTotalSets || totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="repeat-outline" size={32} color={COLORS.info} />
            <Text style={styles.statValue}>{aiTotalReps || totalReps}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </Card>
        </View>

        {/* Exercises Completed */}
        <Card style={styles.exercisesCard}>
          <Text style={styles.sectionTitle}>Exercises Completed</Text>
          {exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseRow}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.sets} sets • {exercise.reps} reps
                  {exercise.weight && exercise.weight > 0 && ` • ${exercise.weight}kg`}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </View>
          ))}
        </Card>

        {/* AI Analysis Section - Show if coming from AI video workout */}
        {(formScore !== undefined || formIssues || formSuggestions) && (
          <Card style={styles.aiAnalysisCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>AI Form Analysis</Text>
            </View>
            
            {/* Form Score */}
            {formScore !== undefined && (
              <View style={styles.aiScoreContainer}>
                <Text style={styles.aiScoreLabel}>Form Score</Text>
                <Text style={[
                  styles.aiScoreValue,
                  { color: formScore >= 80 ? COLORS.success : 
                          formScore >= 60 ? COLORS.warning : COLORS.error }
                ]}>
                  {formScore}%
                </Text>
              </View>
            )}

            {/* Form Issues Detected */}
            {formIssues && formIssues.length > 0 && (
              <View style={styles.issuesSection}>
                <Text style={styles.subsectionTitle}>⚠️ Issues Detected:</Text>
                {formIssues.map((issue: string, idx: number) => (
                  <View key={idx} style={styles.issueItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {formSuggestions && formSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.subsectionTitle}>💡 Suggestions:</Text>
                {formSuggestions.map((suggestion: string, idx: number) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* AI Analysis Section - Legacy support for aiAnalysis object */}
        {aiAnalysis && (
          <Card style={styles.aiAnalysisCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>AI Form Analysis</Text>
            </View>
            
            {/* Form Score */}
            <View style={styles.aiScoreContainer}>
              <Text style={styles.aiScoreLabel}>Average Form Score</Text>
              <Text style={[
                styles.aiScoreValue,
                { color: aiAnalysis.averageFormScore >= 80 ? COLORS.success : 
                        aiAnalysis.averageFormScore >= 60 ? COLORS.warning : COLORS.error }
              ]}>
                {aiAnalysis.averageFormScore}%
              </Text>
            </View>

            {/* Form Issues Detected */}
            {aiAnalysis.formIssues && aiAnalysis.formIssues.length > 0 && (
              <View style={styles.issuesSection}>
                <Text style={styles.subsectionTitle}>⚠️ Issues Detected:</Text>
                {aiAnalysis.formIssues.map((issue: string, idx: number) => (
                  <View key={idx} style={styles.issueItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.issueText}>{issue}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.subsectionTitle}>💡 Suggestions:</Text>
                {aiAnalysis.suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* 7-Day Plan Preview - NEW! */}
        {weeklyPlan && (
          <Card style={styles.planPreviewCard}>
            <View style={styles.planHeader}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Your 7-Day Workout Plan</Text>
            </View>
            <Text style={styles.planSubtitle}>
              Personalized based on your workout data
            </Text>
            
            {loadingPlan ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
            ) : (
              <View style={styles.planDaysContainer}>
                {weeklyPlan.plan_data?.days?.slice(0, 3).map((day: any, index: number) => (
                  <View key={index} style={styles.planDayItem}>
                    <Text style={styles.planDayLabel}>Day {day.day || index + 1}</Text>
                    <Text style={styles.planDayExercises}>
                      {day.exercises?.map((ex: any) => ex.name).join(', ') || 'Rest day'}
                    </Text>
                  </View>
                ))}
                {weeklyPlan.plan_data?.days?.length > 3 && (
                  <Text style={styles.planMoreText}>
                    +{weeklyPlan.plan_data.days.length - 3} more days
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={styles.viewFullPlanButton}
              onPress={() => {
                // Navigate to WorkoutPlan screen
                navigation.navigate('WorkoutPlan' as any);
              }}
            >
              <Text style={styles.viewFullPlanText}>View Full Plan</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Meal Plan Preview - NEW! */}
        {mealPlan && (
          <Card style={styles.planPreviewCard}>
            <View style={styles.planHeader}>
              <Ionicons name="restaurant" size={24} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Your 7-Day Meal Plan</Text>
            </View>
            <Text style={styles.planSubtitle}>
              Personalized nutrition for your fitness goals
            </Text>
            
            {loadingMealPlan ? (
              <ActivityIndicator size="small" color={COLORS.secondary} style={{ marginTop: SPACING.md }} />
            ) : (
              <View style={styles.planDaysContainer}>
                {mealPlan.plan_data?.slice(0, 2).map((day: any, index: number) => (
                  <View key={index} style={styles.mealDayItem}>
                    <View style={styles.mealDayHeader}>
                      <Text style={styles.planDayLabel}>{day.day}</Text>
                      <View style={styles.mealCaloriesBadge}>
                        <Ionicons name="flame" size={14} color={COLORS.error} />
                        <Text style={styles.mealCaloriesText}>
                          {day.total_calories} cal
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.mealSummary}>
                      {day.meals?.length || 0} meals • P: {day.total_protein || 0}g • C: {day.total_carbs || 0}g • F: {day.total_fats || 0}g
                    </Text>
                  </View>
                ))}
                {mealPlan.plan_data?.length > 2 && (
                  <Text style={styles.planMoreText}>
                    +{mealPlan.plan_data.length - 2} more days
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.viewFullPlanButton, { backgroundColor: COLORS.secondary + '10' }]}
              onPress={() => {
                // Navigate to MealPlan screen
                navigation.navigate('MealPlan' as any);
              }}
            >
              <Text style={[styles.viewFullPlanText, { color: COLORS.secondary }]}>View Full Meal Plan</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Notes */}
        {session.notes && (
          <Card style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{session.notes}</Text>
          </Card>
        )}

        {/* Session Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {dateUtils.formatDate(session.start_time)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {session.workout_type || 'General'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ExerciseSelection')}
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryButtonText}>New Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('WorkoutHome')}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  goBackText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  celebrationBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
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
  },
  exercisesCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  notesCard: {
    marginBottom: SPACING.md,
  },
  notesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  // AI Analysis Card Styles
  aiAnalysisCard: {
    marginBottom: SPACING.md,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  aiScoreContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  aiScoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  aiScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  issuesSection: {
    marginBottom: SPACING.md,
  },
  suggestionsSection: {
    marginTop: SPACING.sm,
  },
  subsectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  issueItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  bulletPoint: {
    marginRight: SPACING.sm,
    color: COLORS.textSecondary,
  },
  issueText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  // 7-Day Plan Preview Styles
  planPreviewCard: {
    marginBottom: SPACING.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  planSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  planDaysContainer: {
    marginTop: SPACING.sm,
  },
  planDayItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  planDayLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  planDayExercises: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  planMoreText: {
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  viewFullPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    gap: SPACING.xs,
  },
  viewFullPlanText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  // Meal Plan Specific Styles
  mealDayItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  mealCaloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 12,
    gap: SPACING.xs / 2,
  },
  mealCaloriesText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.error,
  },
  mealSummary: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  // Video Player Styles
  videoCard: {
    marginBottom: SPACING.md,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.text,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  videoPlayer: {
    flex: 1,
  },
  videoExerciseName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  videoExerciseValue: {
    fontWeight: '600',
    color: COLORS.text,
  },
});
