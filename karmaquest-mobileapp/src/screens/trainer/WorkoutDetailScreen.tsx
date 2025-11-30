import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, SPACING, FONT_SIZES, API_CONFIG } from '../../constants';
import apiService from '../../services/api';

const { width } = Dimensions.get('window');

interface ExerciseLog {
  exercise_log_id: string;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  duration?: number;
  form_score?: number;
  feedback?: string;
}

interface WorkoutSession {
  session_id: string;
  user_id: string;
  date: string;
  duration: number;
  calories_burned: number;
  video_url?: string;
  exercise_logs: ExerciseLog[];
  avg_form_score?: number;
}

export const WorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, clientId, clientName } = (route.params as any) || {};
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = React.useRef<Video>(null);

  useEffect(() => {
    if (sessionId && clientId) {
      loadWorkoutDetails();
    }
  }, [sessionId, clientId]);

  const loadWorkoutDetails = async () => {
    try {
      // Get workout session details from trainer API
      const response = await apiService.getClientWorkoutSession(clientId, sessionId);
      
      if (response.success && response.data) {
        setWorkout(response.data as WorkoutSession);
      } else {
        Alert.alert('Error', 'Failed to load workout details');
      }
    } catch (error) {
      console.error('Error loading workout details:', error);
      Alert.alert('Error', 'Failed to load workout details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFullVideoUrl = (videoUrl: string | undefined) => {
    if (!videoUrl) return null;
    
    // If video_url is a relative path, prepend the base URL
    if (videoUrl.startsWith('/')) {
      // Remove /api from BASE_URL since video_url already includes /api/pose/download/...
      const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
      return `${baseUrl}${videoUrl}`;
    }
    
    // If it's already a full URL, return as is
    return videoUrl;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Workout Details</Text>
          <Text style={styles.headerSubtitle}>{clientName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Date & Time */}
        <View style={styles.dateCard}>
          <View style={styles.dateRow}>
            <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(workout.date)}</Text>
          </View>
          <View style={styles.dateRow}>
            <MaterialIcons name="access-time" size={20} color={COLORS.secondary} />
            <Text style={styles.dateText}>{formatTime(workout.date)}</Text>
          </View>
        </View>

        {/* Video Section */}
        {workout.video_url && getFullVideoUrl(workout.video_url) && (
          <View style={styles.videoSection}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="videocam" size={20} color={COLORS.primary} /> Workout Video
            </Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: getFullVideoUrl(workout.video_url)! }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onError={(error) => {
                  console.error('Video error:', error);
                  Alert.alert('Video Error', 'Unable to load workout video. The video may no longer be available.');
                }}
              />
            </View>
            <Text style={styles.videoNote}>
              Note: Videos are temporarily stored and may expire after some time.
            </Text>
          </View>
        )}

        {!workout.video_url && (
          <View style={styles.videoSection}>
            <View style={styles.noVideoCard}>
              <MaterialIcons name="videocam-off" size={48} color={COLORS.textSecondary} />
              <Text style={styles.noVideoText}>No Video Available</Text>
              <Text style={styles.noVideoSubtext}>
                This workout session does not have a recorded video.
              </Text>
            </View>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Workout Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="fitness-center" size={28} color={COLORS.primary} />
              <Text style={styles.statValue}>{workout.exercise_logs?.length || 0}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="access-time" size={28} color={COLORS.secondary} />
              <Text style={styles.statValue}>{workout.duration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="local-fire-department" size={28} color={COLORS.error} />
              <Text style={styles.statValue}>{workout.calories_burned}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            {workout.avg_form_score !== undefined && workout.avg_form_score !== null && (
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={28} color={COLORS.success} />
                <Text style={styles.statValue}>{workout.avg_form_score.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Form Score</Text>
              </View>
            )}
          </View>
        </View>

        {/* Exercise Details */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            <MaterialIcons name="list" size={20} color={COLORS.primary} /> Exercises Performed
          </Text>
          {workout.exercise_logs && workout.exercise_logs.length > 0 ? (
            workout.exercise_logs.map((exercise, index) => (
              <View key={exercise.exercise_log_id || index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{exercise.exercise_name}</Text>
                </View>

                <View style={styles.exerciseDetails}>
                  <View style={styles.exerciseDetailRow}>
                    <MaterialIcons name="repeat" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.exerciseDetailText}>
                      Sets: {exercise.sets_completed || 0}
                    </Text>
                  </View>
                  <View style={styles.exerciseDetailRow}>
                    <MaterialIcons name="fitness-center" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.exerciseDetailText}>
                      Reps: {exercise.reps_completed || 0}
                    </Text>
                  </View>
                  {exercise.weight_used && exercise.weight_used > 0 && (
                    <View style={styles.exerciseDetailRow}>
                      <MaterialIcons name="scale" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.exerciseDetailText}>
                        Weight: {exercise.weight_used} lbs
                      </Text>
                    </View>
                  )}
                  {exercise.duration && exercise.duration > 0 && (
                    <View style={styles.exerciseDetailRow}>
                      <MaterialIcons name="timer" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.exerciseDetailText}>
                        Duration: {exercise.duration} sec
                      </Text>
                    </View>
                  )}
                </View>

                {exercise.form_score !== undefined && exercise.form_score !== null && (
                  <View style={styles.formScoreContainer}>
                    <Text style={styles.formScoreLabel}>Form Score:</Text>
                    <View style={[
                      styles.formScoreBadge,
                      {
                        backgroundColor: 
                          exercise.form_score >= 80 ? COLORS.success + '20' :
                          exercise.form_score >= 60 ? COLORS.warning + '20' :
                          COLORS.error + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.formScoreText,
                        {
                          color: 
                            exercise.form_score >= 80 ? COLORS.success :
                            exercise.form_score >= 60 ? COLORS.warning :
                            COLORS.error
                        }
                      ]}>
                        {exercise.form_score.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}

                {exercise.feedback && (
                  <View style={styles.feedbackContainer}>
                    <MaterialIcons name="chat-bubble" size={16} color={COLORS.info} />
                    <Text style={styles.feedbackText}>{exercise.feedback}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No exercise details available</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  dateCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  videoSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  videoContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  video: {
    width: width - SPACING.lg * 2,
    height: ((width - SPACING.lg * 2) * 9) / 16, // 16:9 aspect ratio
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  exercisesSection: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  exerciseCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  exerciseNumberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  exerciseName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  exerciseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  formScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formScoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  formScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formScoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.info + '10',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  feedbackText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  videoNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  noVideoCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noVideoText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  noVideoSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
