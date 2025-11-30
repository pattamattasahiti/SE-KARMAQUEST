import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import apiService from '../../services/api';

interface ClientPerformance {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  workout_history: Array<{
    session_id: string;
    date: string;
    exercises_count: number;
    duration: number;
    calories_burned: number;
    form_score?: number;
  }>;
  total_workouts: number;
  avg_duration: number;
  total_calories: number;
  avg_form_score: number;
}

export const ClientDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { clientId } = (route.params as any) || {};
  
  const [client, setClient] = useState<ClientPerformance | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'performance' | 'plan' | 'feedback'>('performance');
  
  // Edit Plan Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editablePlan, setEditablePlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      // Load performance data
      const perfResponse = await apiService.getClientPerformance(clientId, 30);
      if (perfResponse.success && perfResponse.data) {
        setClient(perfResponse.data as ClientPerformance);
      }

      // Load workout plan
      const planResponse = await apiService.getClientWorkoutPlan(clientId);
      if (planResponse.success && planResponse.data) {
        // Extract plan from response data
        const plan = (planResponse.data as any).plan;
        setWorkoutPlan(plan);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('Error', 'Failed to load client data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientData();
  };

  const handleAddFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter feedback text');
      return;
    }

    if (!selectedSessionId) {
      Alert.alert('Error', 'Please select a workout session');
      return;
    }

    try {
      const response = await apiService.addClientFeedback(
        clientId,
        selectedSessionId,
        feedbackText
      );

      if (response.success) {
        Alert.alert('Success', 'Feedback added successfully');
        setFeedbackText('');
        setSelectedSessionId(null);
        setShowFeedbackModal(false);
        loadClientData();
      } else {
        Alert.alert('Error', response.error || 'Failed to add feedback');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add feedback');
    }
  };

  const handleAdjustPlan = () => {
    if (!workoutPlan || !workoutPlan.plan_data) {
      Alert.alert('Error', 'No active workout plan to adjust');
      return;
    }

    // Create a deep copy of the plan for editing
    setEditablePlan(JSON.parse(JSON.stringify(workoutPlan)));
    setShowEditModal(true);
  };

  const handleSavePlanChanges = async () => {
    if (!editablePlan || !editablePlan.plan_data) {
      Alert.alert('Error', 'Invalid plan data');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.adjustClientWorkoutPlan(clientId, { 
        plan_data: editablePlan.plan_data 
      });
      
      if (response.success) {
        Alert.alert('Success', 'Workout plan updated successfully!');
        setShowEditModal(false);
        loadClientData(); // Refresh the data
      } else {
        Alert.alert('Error', response.error || 'Failed to update workout plan');
      }
    } catch (error: any) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', error.message || 'Failed to update workout plan');
    } finally {
      setSaving(false);
    }
  };

  const updateExerciseField = (dayIndex: number, exerciseIndex: number, field: string, value: any) => {
    const updatedPlan = { ...editablePlan };
    updatedPlan.plan_data.days[dayIndex].exercises[exerciseIndex][field] = value;
    setEditablePlan(updatedPlan);
  };

  const updateDayField = (dayIndex: number, field: string, value: any) => {
    const updatedPlan = { ...editablePlan };
    updatedPlan.plan_data.days[dayIndex][field] = value;
    setEditablePlan(updatedPlan);
  };

  const toggleRestDay = (dayIndex: number) => {
    const updatedPlan = { ...editablePlan };
    const day = updatedPlan.plan_data.days[dayIndex];
    
    if (day.exercises && day.exercises.length > 0) {
      // Convert to rest day
      day.exercises = [];
      day.focus = 'Rest';
      day.estimated_duration_minutes = 0;
      day.notes = 'Rest day - recovery and light stretching';
    } else {
      // Convert from rest day to workout day
      day.focus = 'Full';
      day.notes = 'Workout day added by trainer';
    }
    
    setEditablePlan(updatedPlan);
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPlan = { ...editablePlan };
            updatedPlan.plan_data.days[dayIndex].exercises.splice(exerciseIndex, 1);
            setEditablePlan(updatedPlan);
          },
        },
      ]
    );
  };

  const handleApprovePlan = () => {
    Alert.alert(
      'Approve Plan',
      'Mark this workout plan as approved? The client will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            // In a real app, this would send a notification and update plan status
            Alert.alert('Success', 'Plan approved successfully! Client has been notified.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Client not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            // Navigate back to ClientList explicitly
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              (navigation as any).navigate('ClientList');
            }
          }} 
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {client.first_name} {client.last_name}
          </Text>
          <Text style={styles.headerSubtitle}>{client.email}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
          onPress={() => setActiveTab('performance')}
        >
          <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plan' && styles.tabActive]}
          onPress={() => setActiveTab('plan')}
        >
          <Text style={[styles.tabText, activeTab === 'plan' && styles.tabTextActive]}>
            Workout Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feedback' && styles.tabActive]}
          onPress={() => setActiveTab('feedback')}
        >
          <Text style={[styles.tabText, activeTab === 'feedback' && styles.tabTextActive]}>
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View>
            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <MaterialIcons name="fitness-center" size={24} color={COLORS.primary} />
                <Text style={styles.statValue}>{client.total_workouts}</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialIcons name="access-time" size={24} color={COLORS.secondary} />
                <Text style={styles.statValue}>{Math.round(client.avg_duration)} min</Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialIcons name="local-fire-department" size={24} color={COLORS.error} />
                <Text style={styles.statValue}>{client.total_calories}</Text>
                <Text style={styles.statLabel}>Total Calories</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialIcons name="star" size={24} color={COLORS.success} />
                <Text style={styles.statValue}>
                  {client.avg_form_score ? client.avg_form_score.toFixed(1) : '0.0'}%
                </Text>
                <Text style={styles.statLabel}>Form Score</Text>
              </View>
            </View>

            {/* Workout History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Workouts (30 Days)</Text>
              {client.workout_history && client.workout_history.length > 0 ? (
                client.workout_history.map((workout, index) => (
                  <TouchableOpacity
                    key={workout.session_id || index}
                    style={styles.workoutCard}
                    onPress={() => {
                      (navigation as any).navigate('WorkoutDetail', {
                        sessionId: workout.session_id,
                        clientId: clientId,
                        clientName: `${client.first_name} ${client.last_name}`,
                      });
                    }}
                  >
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutDate}>
                        {new Date(workout.date).toLocaleDateString()}
                      </Text>
                      {workout.form_score !== undefined && workout.form_score !== null && (
                        <View style={styles.formScoreBadge}>
                          <Text style={styles.formScoreText}>
                            Form: {workout.form_score.toFixed(0)}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.workoutStats}>
                      <View style={styles.workoutStat}>
                        <MaterialIcons name="fitness-center" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.workoutStatText}>{workout.exercises_count} exercises</Text>
                      </View>
                      <View style={styles.workoutStat}>
                        <MaterialIcons name="access-time" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.workoutStatText}>{workout.duration} min</Text>
                      </View>
                      <View style={styles.workoutStat}>
                        <MaterialIcons name="local-fire-department" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.workoutStatText}>{workout.calories_burned} cal</Text>
                      </View>
                    </View>
                    <View style={styles.workoutFooter}>
                      <TouchableOpacity
                        style={styles.addFeedbackButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedSessionId(workout.session_id);
                          setShowFeedbackModal(true);
                        }}
                      >
                        <MaterialIcons name="chat-bubble-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.addFeedbackText}>Add Feedback</Text>
                      </TouchableOpacity>
                      <View style={styles.viewDetailsButton}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noDataText}>No workout history available</Text>
              )}
            </View>
          </View>
        )}

        {/* Workout Plan Tab */}
        {activeTab === 'plan' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Workout Plan</Text>
            {workoutPlan && workoutPlan.plan_data ? (
              <View>
                {/* Plan Overview */}
                <View style={styles.planOverviewCard}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planTitle}>Weekly Workout Plan</Text>
                      {workoutPlan.plan_data.fitness_level && (
                        <Text style={styles.planSubtitle}>
                          Level: {workoutPlan.plan_data.fitness_level.charAt(0).toUpperCase() + workoutPlan.plan_data.fitness_level.slice(1)}
                        </Text>
                      )}
                    </View>
                    {workoutPlan.is_active && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.planMetadata}>
                    <View style={styles.metadataItem}>
                      <MaterialIcons name="date-range" size={16} color={COLORS.primary} />
                      <Text style={styles.metadataText}>
                        {new Date(workoutPlan.start_date).toLocaleDateString()} - {new Date(workoutPlan.end_date).toLocaleDateString()}
                      </Text>
                    </View>
                    {workoutPlan.plan_data.based_on_workouts > 0 && (
                      <View style={styles.metadataItem}>
                        <MaterialIcons name="auto-awesome" size={16} color={COLORS.primary} />
                        <Text style={styles.metadataText}>
                          Personalized (based on {workoutPlan.plan_data.based_on_workouts} workouts)
                        </Text>
                      </View>
                    )}
                    {workoutPlan.plan_data.avg_form_score && (
                      <View style={styles.metadataItem}>
                        <MaterialIcons name="assessment" size={16} color={COLORS.primary} />
                        <Text style={styles.metadataText}>
                          Avg Form Score: {workoutPlan.plan_data.avg_form_score}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Daily Workout Schedule */}
                <Text style={styles.subsectionTitle}>Weekly Schedule</Text>
                {workoutPlan.plan_data.days && workoutPlan.plan_data.days.map((day: any, index: number) => (
                  <View key={index} style={styles.dayCard}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayName}>{day.day_name}</Text>
                        <Text style={styles.dayFocus}>{day.focus}</Text>
                      </View>
                      {day.estimated_duration_minutes > 0 && (
                        <View style={styles.durationBadge}>
                          <MaterialIcons name="schedule" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.durationText}>{day.estimated_duration_minutes} min</Text>
                        </View>
                      )}
                    </View>

                    {day.exercises && day.exercises.length > 0 ? (
                      <View style={styles.exercisesList}>
                        {day.exercises.map((exercise: any, exIndex: number) => (
                          <View key={exIndex} style={styles.exerciseItem}>
                            <View style={styles.exerciseIcon}>
                              <MaterialIcons name="fitness-center" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.exerciseDetails}>
                              <Text style={styles.exerciseName}>{exercise.name || exercise.exercise_name}</Text>
                              <View style={styles.exerciseStats}>
                                {exercise.sets && (
                                  <Text style={styles.exerciseStat}>{exercise.sets} sets</Text>
                                )}
                                {exercise.reps && (
                                  <Text style={styles.exerciseStat}>• {exercise.reps} reps</Text>
                                )}
                                {exercise.duration && (
                                  <Text style={styles.exerciseStat}>• {exercise.duration}s hold</Text>
                                )}
                                {exercise.rest && (
                                  <Text style={styles.exerciseStat}>• {exercise.rest}s rest</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.restDayContent}>
                        <MaterialIcons name="spa" size={24} color={COLORS.success} />
                        <Text style={styles.restDayText}>Rest Day</Text>
                      </View>
                    )}

                    {day.notes && (
                      <View style={styles.dayNotes}>
                        <MaterialIcons name="info-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.dayNotesText}>{day.notes}</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                    onPress={handleApprovePlan}
                  >
                    <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Approve Plan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
                    onPress={handleAdjustPlan}
                  >
                    <MaterialIcons name="edit" size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Adjust Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noPlanCard}>
                <MaterialIcons name="event-busy" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noPlanText}>No Active Workout Plan</Text>
                <Text style={styles.noPlanSubtext}>
                  This client doesn't have an active workout plan yet. Plans are automatically generated based on their workout history.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Feedback</Text>
            
            {/* Workout Sessions List */}
            <Text style={styles.subsectionTitle}>Recent Workout Sessions</Text>
            {client.workout_history && client.workout_history.length > 0 ? (
              <View style={styles.workoutSessionsList}>
                {client.workout_history.map((workout: any) => (
                  <TouchableOpacity
                    key={workout.session_id}
                    style={[
                      styles.sessionCard,
                      selectedSessionId === workout.session_id && styles.sessionCardSelected
                    ]}
                    onPress={() => {
                      setSelectedSessionId(workout.session_id);
                      // Clear previous feedback text when selecting a new session
                      setFeedbackText('');
                    }}
                  >
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionDateContainer}>
                        <MaterialIcons name="calendar-today" size={16} color={COLORS.primary} />
                        <Text style={styles.sessionDate}>
                          {new Date(workout.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      {selectedSessionId === workout.session_id && (
                        <View style={styles.selectedBadge}>
                          <MaterialIcons name="check-circle" size={16} color={COLORS.white} />
                          <Text style={styles.selectedBadgeText}>Selected</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.sessionCardStats}>
                      <View style={styles.sessionStat}>
                        <MaterialIcons name="fitness-center" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.sessionStatText}>{workout.exercises_count} exercises</Text>
                      </View>
                      <View style={styles.sessionStat}>
                        <MaterialIcons name="schedule" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.sessionStatText}>{workout.duration} min</Text>
                      </View>
                      <View style={styles.sessionStat}>
                        <MaterialIcons name="local-fire-department" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.sessionStatText}>{workout.calories_burned} cal</Text>
                      </View>
                    </View>

                    {workout.form_score !== undefined && workout.form_score !== null && (
                      <View style={styles.sessionFormScore}>
                        <Text style={styles.formScoreLabel}>Form Score:</Text>
                        <View style={[
                          styles.sessionFormScoreBadge,
                          { backgroundColor: workout.form_score >= 80 ? COLORS.success : workout.form_score >= 60 ? COLORS.warning : COLORS.error }
                        ]}>
                          <Text style={styles.formScoreValue}>{workout.form_score.toFixed(1)}%</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noSessionsCard}>
                <MaterialIcons name="event-busy" size={32} color={COLORS.textSecondary} />
                <Text style={styles.noSessionsText}>No workout sessions yet</Text>
              </View>
            )}

            {/* Feedback Form */}
            {selectedSessionId ? (
              <View style={styles.feedbackForm}>
                <View style={styles.feedbackFormHeader}>
                  <MaterialIcons name="rate-review" size={24} color={COLORS.primary} />
                  <Text style={styles.feedbackFormTitle}>Write Your Feedback</Text>
                </View>
                
                <Text style={styles.label}>Quick Templates</Text>
                <View style={styles.templateButtonsContainer}>
                  {[
                    { icon: 'thumb-up', text: 'Great job!', message: 'Great job! Keep up the excellent work. Your form and consistency are improving.' },
                    { icon: 'info', text: 'Form Tips', message: 'Focus on maintaining proper form throughout each exercise. Quality over quantity.' },
                    { icon: 'trending-up', text: 'Progress', message: 'Excellent progress! Consider increasing the intensity in your next session.' },
                    { icon: 'spa', text: 'Recovery', message: 'Take adequate rest between sets and sessions. Recovery is crucial for progress.' },
                  ].map((template, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.templateButton}
                      onPress={() => setFeedbackText(template.message)}
                    >
                      <MaterialIcons name={template.icon as any} size={18} color={COLORS.primary} />
                      <Text style={styles.templateButtonText}>{template.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Custom Feedback</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Provide custom feedback or guidance for this workout session..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                
                <TouchableOpacity
                  style={[styles.submitButton, (!feedbackText.trim() || !selectedSessionId) && styles.submitButtonDisabled]}
                  onPress={handleAddFeedback}
                  disabled={!feedbackText.trim() || !selectedSessionId}
                >
                  <MaterialIcons name="send" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Send Feedback to Client</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.selectSessionPrompt}>
                <MaterialIcons name="touch-app" size={48} color={COLORS.textSecondary} />
                <Text style={styles.selectSessionText}>Select a workout session above to provide feedback</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Plan Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Workout Plan</Text>
            <TouchableOpacity 
              onPress={handleSavePlanChanges}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons name="check" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* Editable Plan Content */}
          <ScrollView style={styles.modalContent}>
            {editablePlan && editablePlan.plan_data && editablePlan.plan_data.days ? (
              editablePlan.plan_data.days.map((day: any, dayIndex: number) => (
                <View key={dayIndex} style={styles.editDayCard}>
                  {/* Day Header */}
                  <View style={styles.editDayHeader}>
                    <View style={styles.editDayInfo}>
                      <Text style={styles.editDayName}>{day.day_name}</Text>
                      <TextInput
                        style={styles.editFocusInput}
                        value={day.focus}
                        onChangeText={(text) => updateDayField(dayIndex, 'focus', text)}
                        placeholder="Focus area"
                        placeholderTextColor={COLORS.textSecondary}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.toggleRestButton}
                      onPress={() => toggleRestDay(dayIndex)}
                    >
                      <MaterialIcons 
                        name={day.exercises && day.exercises.length > 0 ? 'spa' : 'fitness-center'} 
                        size={20} 
                        color={COLORS.white} 
                      />
                      <Text style={styles.toggleRestText}>
                        {day.exercises && day.exercises.length > 0 ? 'Make Rest' : 'Add Workout'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Exercises List */}
                  {day.exercises && day.exercises.length > 0 ? (
                    <View style={styles.editExercisesList}>
                      {day.exercises.map((exercise: any, exIndex: number) => (
                        <View key={exIndex} style={styles.editExerciseCard}>
                          <View style={styles.editExerciseHeader}>
                            <TextInput
                              style={styles.editExerciseName}
                              value={exercise.name || exercise.exercise_name}
                              onChangeText={(text) => updateExerciseField(dayIndex, exIndex, 'name', text)}
                              placeholder="Exercise name"
                              placeholderTextColor={COLORS.textSecondary}
                            />
                            <TouchableOpacity
                              onPress={() => removeExercise(dayIndex, exIndex)}
                              style={styles.removeExerciseButton}
                            >
                              <MaterialIcons name="delete-outline" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.editExerciseInputs}>
                            {/* Sets */}
                            {exercise.sets !== undefined && (
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Sets</Text>
                                <TextInput
                                  style={styles.numberInput}
                                  value={String(exercise.sets)}
                                  onChangeText={(text) => updateExerciseField(dayIndex, exIndex, 'sets', parseInt(text) || 0)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            )}

                            {/* Reps */}
                            {exercise.reps !== undefined && (
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Reps</Text>
                                <TextInput
                                  style={styles.numberInput}
                                  value={String(exercise.reps)}
                                  onChangeText={(text) => updateExerciseField(dayIndex, exIndex, 'reps', parseInt(text) || 0)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            )}

                            {/* Duration */}
                            {exercise.duration !== undefined && (
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Duration (s)</Text>
                                <TextInput
                                  style={styles.numberInput}
                                  value={String(exercise.duration)}
                                  onChangeText={(text) => updateExerciseField(dayIndex, exIndex, 'duration', parseInt(text) || 0)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            )}

                            {/* Rest */}
                            {exercise.rest !== undefined && (
                              <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Rest (s)</Text>
                                <TextInput
                                  style={styles.numberInput}
                                  value={String(exercise.rest)}
                                  onChangeText={(text) => updateExerciseField(dayIndex, exIndex, 'rest', parseInt(text) || 0)}
                                  keyboardType="numeric"
                                  placeholder="0"
                                />
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.editRestDay}>
                      <MaterialIcons name="spa" size={32} color={COLORS.success} />
                      <Text style={styles.editRestDayText}>Rest Day</Text>
                    </View>
                  )}

                  {/* Day Notes */}
                  <View style={styles.editNotesSection}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={day.notes || ''}
                      onChangeText={(text) => updateDayField(dayIndex, 'notes', text)}
                      placeholder="Add motivational notes or instructions..."
                      placeholderTextColor={COLORS.textSecondary}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No plan data to edit</Text>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSavePlanChanges}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  workoutCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  formScoreBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formScoreText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.success,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addFeedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  addFeedbackText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  planCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  planDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  planDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  feedbackForm: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  selectedSession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  selectedSessionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 120,
    marginBottom: SPACING.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  templateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  templateText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  // Enhanced Workout Plan Styles
  planOverviewCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  activeBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  planMetadata: {
    gap: SPACING.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metadataText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  subsectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  dayCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dayFocus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  durationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  exercisesList: {
    gap: SPACING.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  exerciseStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  exerciseStat: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  restDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  restDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    fontWeight: '600',
  },
  dayNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  dayNotesText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  noPlanCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noPlanText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  noPlanSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  // Edit Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  editDayCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editDayInfo: {
    flex: 1,
  },
  editDayName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  editFocusInput: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: SPACING.xs,
  },
  toggleRestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  toggleRestText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  editExercisesList: {
    gap: SPACING.md,
  },
  editExerciseCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  editExerciseName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  removeExerciseButton: {
    padding: SPACING.xs,
  },
  editExerciseInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  inputGroup: {
    minWidth: '22%',
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  numberInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  editRestDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  editRestDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  editNotesSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    minHeight: 60,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  modalFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Feedback Tab Styles
  workoutSessionsList: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sessionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F7FF',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sessionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sessionDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  sessionCardStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sessionStatText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  sessionFormScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formScoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sessionFormScoreBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  formScoreValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  noSessionsCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  noSessionsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  feedbackFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  feedbackFormTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  templateButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  templateButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectSessionPrompt: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  selectSessionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
