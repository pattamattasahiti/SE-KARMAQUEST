import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, EXERCISES } from '../../constants';
import { isExerciseAISupported } from '../../constants/exerciseMapping';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

type ExerciseSelectionScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'ExerciseSelection'>;

interface Props {
  navigation: ExerciseSelectionScreenNavigationProp;
}

interface ExerciseCategory {
  name: string;
  exercises: string[];
}

const categories: ExerciseCategory[] = [
  { name: 'Push', exercises: ['Push-ups', 'Bench Press', 'Shoulder Press', 'Dips', 'Tricep Extensions'] },
  { name: 'Pull', exercises: ['Pull-ups', 'Rows', 'Lat Pulldown', 'Face Pulls', 'Bicep Curls'] },
  { name: 'Legs', exercises: ['Squats', 'Lunges', 'Leg Press', 'Deadlifts'] },
  { name: 'Core', exercises: ['Plank', 'Crunches', 'Russian Twists', 'Leg Raises'] },
];

export default function ExerciseSelectionScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('Push');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleExercise = (exercise: string) => {
    if (selectedExercises.includes(exercise)) {
      setSelectedExercises(selectedExercises.filter(e => e !== exercise));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const startWorkout = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercises', 'Please select at least one exercise');
      return;
    }

    setLoading(true);
    try {
      // Start a new workout session
      const response = await apiService.startWorkoutSession({
        planned_exercises: selectedExercises,
        workout_type: selectedCategory.toLowerCase()
      });

      console.log('Start workout response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const sessionData = response.data as any;
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
        
        // Backend returns { data: { session: { session_id: ... } } }
        const sessionId = sessionData.session?.session_id || sessionData.session_id || sessionData.id;
        
        console.log('Extracted session ID:', sessionId);
        
        if (!sessionId) {
          throw new Error('No session ID returned from server');
        }
        
        navigation.navigate('LiveWorkout', { 
          sessionId: sessionId,
          exercises: selectedExercises 
        });
      }
    } catch (error: any) {
      console.error('Start workout error:', error);
      Alert.alert('Error', error.message || 'Failed to start workout');
    } finally {
      setLoading(false);
    }
  };

  const startAICameraWorkout = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert('No Exercise Selected', 'Please select one exercise for AI camera analysis');
      return;
    }

    if (selectedExercises.length > 1) {
      Alert.alert(
        'Multiple Exercises',
        'AI Camera mode works best with one exercise at a time. Continue with just the first exercise?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue',
            onPress: () => startSingleExerciseWithCamera(selectedExercises[0])
          }
        ]
      );
      return;
    }

    startSingleExerciseWithCamera(selectedExercises[0]);
  };

  const startSingleExerciseWithCamera = async (exercise: string) => {
    setLoading(true);
    try {
      const response = await apiService.startWorkoutSession({
        planned_exercises: [exercise],
        workout_type: 'ai_camera'
      });

      console.log('Start camera workout response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const sessionData = response.data as any;
        console.log('Camera session data:', JSON.stringify(sessionData, null, 2));
        
        // Backend returns { data: { session: { session_id: ... } } }
        const sessionId = sessionData.session?.session_id || sessionData.session_id || sessionData.id;
        
        console.log('Extracted camera session ID:', sessionId);
        
        if (!sessionId) {
          throw new Error('No session ID returned from server');
        }
        
        // Route to AIVideoWorkout for AI-supported exercises, LiveCameraWorkout for others
        if (isExerciseAISupported(exercise)) {
          console.log(`Routing to AIVideoWorkout for ${exercise} (AI-supported)`);
          navigation.navigate('AIVideoWorkout', { 
            sessionId: sessionId,
            exerciseName: exercise
          });
        } else {
          console.log(`Routing to LiveCameraWorkout for ${exercise} (real-time analysis)`);
          navigation.navigate('LiveCameraWorkout', { 
            sessionId: sessionId,
            exercise: exercise,
            targetSets: 3,
            targetReps: 10
          });
        }
      }
    } catch (error: any) {
      console.error('Start camera workout error:', error);
      Alert.alert('Error', error.message || 'Failed to start AI camera workout');
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find(c => c.name === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === item.name && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(item.name)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.name && styles.categoryTextActive
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Selected Count */}
      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
        </Text>
      </View>

      {/* Exercise List */}
      <FlatList
        data={currentCategory?.exercises || []}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const isSelected = selectedExercises.includes(item);
          const exerciseInfo = EXERCISES[item as keyof typeof EXERCISES];
          const hasAISupport = isExerciseAISupported(item);

          return (
            <TouchableOpacity onPress={() => toggleExercise(item)}>
              <Card style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}>
                <View style={styles.exerciseContent}>
                  <View style={styles.exerciseInfo}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={styles.exerciseName}>{item}</Text>
                      {hasAISupport && (
                        <View style={styles.aiBadge}>
                          <Ionicons name="camera" size={12} color={COLORS.white} />
                          <Text style={styles.aiBadgeText}>AI</Text>
                        </View>
                      )}
                    </View>
                    {exerciseInfo && (
                      <Text style={styles.exerciseDetails}>
                        {exerciseInfo.muscleGroup} • {exerciseInfo.difficulty}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {/* Start Workout Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.aiCameraButton, loading && styles.startButtonDisabled]}
          onPress={startAICameraWorkout}
          disabled={loading || selectedExercises.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="camera" size={24} color={COLORS.white} />
              <Text style={styles.startButtonText}>Start AI Workout</Text>
            </>
          )}
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
  categoryContainer: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  selectedCountContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  selectedCountText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: SPACING.md,
  },
  exerciseCard: {
    marginBottom: SPACING.md,
  },
  exerciseCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  exerciseName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  exerciseDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  aiCameraButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
