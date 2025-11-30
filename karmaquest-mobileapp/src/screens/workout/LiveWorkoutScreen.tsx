import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList, ExerciseLog } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';
import { formatDuration } from '../../utils';

type LiveWorkoutScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'LiveWorkout'>;
type LiveWorkoutScreenRouteProp = RouteProp<WorkoutStackParamList, 'LiveWorkout'>;

interface Props {
  navigation: LiveWorkoutScreenNavigationProp;
  route: LiveWorkoutScreenRouteProp;
}

interface ExerciseSet {
  reps: string;
  weight: string;
  completed: boolean;
}

interface ExerciseProgress {
  exercise: string;
  sets: ExerciseSet[];
}

export default function LiveWorkoutScreen({ route, navigation }: Props) {
  const { sessionId, exercises } = route.params;
  
  console.log('LiveWorkoutScreen - Received sessionId:', sessionId);
  console.log('LiveWorkoutScreen - Received exercises:', exercises);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>(
    exercises.map((exercise: string) => ({
      exercise,
      sets: [{ reps: '', weight: '', completed: false }]
    }))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start workout timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isResting && restTimeRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restTimeRemaining]);

  const currentExercise = exerciseProgress[currentExerciseIndex];

  const updateSet = (setIndex: number, field: 'reps' | 'weight', value: string) => {
    const newProgress = [...exerciseProgress];
    newProgress[currentExerciseIndex].sets[setIndex][field] = value;
    setExerciseProgress(newProgress);
  };

  const completeSet = (setIndex: number) => {
    const set = currentExercise.sets[setIndex];
    if (!set.reps || !set.weight) {
      Alert.alert('Incomplete Set', 'Please enter reps and weight');
      return;
    }

    const newProgress = [...exerciseProgress];
    newProgress[currentExerciseIndex].sets[setIndex].completed = true;
    setExerciseProgress(newProgress);

    // Start rest timer (60 seconds)
    setIsResting(true);
    setRestTimeRemaining(60);
  };

  const addSet = () => {
    const newProgress = [...exerciseProgress];
    newProgress[currentExerciseIndex].sets.push({ reps: '', weight: '', completed: false });
    setExerciseProgress(newProgress);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      finishWorkout();
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const finishWorkout = async () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to complete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            setLoading(true);
            try {
              console.log('Finishing workout with sessionId:', sessionId);
              
              // Log all exercises
              const exerciseLogs: Partial<ExerciseLog>[] = [];
              
              for (const progress of exerciseProgress) {
                const completedSets = progress.sets.filter(s => s.completed);
                if (completedSets.length > 0) {
                  const totalReps = completedSets.reduce((sum, s) => sum + parseInt(s.reps || '0'), 0);
                  const avgWeight = completedSets.reduce((sum, s) => sum + parseFloat(s.weight || '0'), 0) / completedSets.length;
                  
                  exerciseLogs.push({
                    session_id: sessionId,
                    exercise_name: progress.exercise,
                    sets: completedSets.length,
                    reps: totalReps,
                    weight: avgWeight,
                    duration: Math.floor(elapsedTime / exercises.length) // Approximate
                  });
                }
              }

              console.log('Exercise logs to submit:', exerciseLogs);

              // Log exercises
              for (const log of exerciseLogs) {
                console.log('Logging exercise:', log.exercise_name);
                await apiService.logExercise(sessionId, log);
              }

              // Complete session
              console.log('Updating session with notes and duration');
              await apiService.updateWorkoutSession(sessionId, {
                notes,
                actual_duration: elapsedTime
              });

              console.log('Completing session');
              await apiService.completeWorkoutSession(sessionId);

              console.log('Navigating to summary');
              navigation.navigate('WorkoutSummary', { sessionId });
            } catch (error: any) {
              console.error('Error finishing workout:', error);
              Alert.alert('Error', error.message || 'Failed to finish workout');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const cancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? All progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelWorkout}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout in Progress</Text>
        <TouchableOpacity onPress={finishWorkout} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Ionicons name="checkmark" size={28} color={COLORS.success} />
          )}
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerLabel}>Duration</Text>
        <Text style={styles.timerText}>{formatDuration(elapsedTime)}</Text>
      </Card>

      {/* Rest Timer */}
      {isResting && (
        <Card style={styles.restCard}>
          <Text style={styles.restLabel}>Rest Time</Text>
          <Text style={styles.restText}>{restTimeRemaining}s</Text>
        </Card>
      )}

      {/* Exercise Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </Text>
        <View style={styles.progressBar}>
          {exercises.map((_: any, index: number) => (
            <View
              key={index}
              style={[
                styles.progressSegment,
                index <= currentExerciseIndex && styles.progressSegmentActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Current Exercise */}
      <ScrollView style={styles.exerciseContainer}>
        <Text style={styles.exerciseTitle}>{currentExercise.exercise}</Text>

        {/* Sets */}
        {currentExercise.sets.map((set, index) => (
          <Card key={index} style={styles.setCard}>
            <View style={styles.setHeader}>
              <Text style={styles.setTitle}>Set {index + 1}</Text>
              {set.completed && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              )}
            </View>
            <View style={styles.setInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  value={set.reps}
                  onChangeText={(text) => updateSet(index, 'reps', text)}
                  keyboardType="numeric"
                  placeholder="0"
                  editable={!set.completed}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={[styles.input, set.completed && styles.inputDisabled]}
                  value={set.weight}
                  onChangeText={(text) => updateSet(index, 'weight', text)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  editable={!set.completed}
                />
              </View>
              {!set.completed && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => completeSet(index)}
                >
                  <Ionicons name="checkmark" size={24} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}

        <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addSetText}>Add Set</Text>
        </TouchableOpacity>

        {/* Notes */}
        <Card style={styles.notesCard}>
          <Text style={styles.notesLabel}>Workout Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did this workout feel?"
            multiline
            numberOfLines={3}
          />
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentExerciseIndex === 0 && styles.navButtonDisabled]}
          onPress={previousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={nextExercise}
        >
          <Text style={styles.navButtonText}>
            {currentExerciseIndex === exercises.length - 1 ? 'Finish' : 'Next'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  timerCard: {
    margin: SPACING.md,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timerText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  restCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
  },
  restLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  restText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
  },
  exerciseContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  exerciseTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  setCard: {
    marginBottom: SPACING.md,
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  setTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  setInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputDisabled: {
    backgroundColor: COLORS.border,
  },
  completeButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  addSetText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  notesCard: {
    marginBottom: SPACING.md,
  },
  notesLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  navButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
