import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { Card } from '../../components/common/Card';
import apiService from '../../services/api';

type NavigationProp = StackNavigationProp<WorkoutStackParamList>;

// Exercise library data
const EXERCISES = [
  {
    id: 'squat',
    name: 'Squats',
    category: 'Lower Body',
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    icon: 'fitness',
    color: COLORS.primary,
    description: 'A fundamental lower body exercise that targets multiple muscle groups',
  },
  {
    id: 'pushup',
    name: 'Push-ups',
    category: 'Upper Body',
    difficulty: 'Beginner',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    equipment: 'Bodyweight',
    icon: 'body',
    color: COLORS.secondary,
    description: 'Classic upper body exercise for building chest and arm strength',
  },
  {
    id: 'lunge',
    name: 'Lunges',
    category: 'Lower Body',
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: 'Bodyweight',
    icon: 'walk',
    color: COLORS.success,
    description: 'Unilateral leg exercise for balance and lower body strength',
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    difficulty: 'Beginner',
    targetMuscles: ['Abs', 'Core', 'Shoulders'],
    equipment: 'Bodyweight',
    icon: 'remove',
    color: COLORS.warning,
    description: 'Isometric core exercise for building stability and strength',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'Full Body',
    difficulty: 'Intermediate',
    targetMuscles: ['Back', 'Hamstrings', 'Glutes'],
    equipment: 'Barbell',
    icon: 'barbell',
    color: COLORS.error,
    description: 'Compound movement for overall strength and power',
  },
  {
    id: 'pullup',
    name: 'Pull-ups',
    category: 'Upper Body',
    difficulty: 'Intermediate',
    targetMuscles: ['Back', 'Biceps', 'Lats'],
    equipment: 'Pull-up Bar',
    icon: 'arrow-up',
    color: COLORS.info,
    description: 'Upper body pulling exercise for back and arm development',
  },
];

const CATEGORIES = ['All', 'Upper Body', 'Lower Body', 'Core', 'Full Body'];
const DIFFICULTY_LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function ExerciseLibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [exercises, setExercises] = useState(EXERCISES);
  const [filteredExercises, setFilteredExercises] = useState(EXERCISES);

  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const filterExercises = () => {
    let filtered = exercises;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.targetMuscles.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ex => ex.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(ex => ex.difficulty === selectedDifficulty);
    }

    setFilteredExercises(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return COLORS.success;
      case 'Intermediate': return COLORS.warning;
      case 'Advanced': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Library</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Difficulty Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Difficulty</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {DIFFICULTY_LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  selectedDifficulty === level && styles.filterChipActive
                ]}
                onPress={() => setSelectedDifficulty(level)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedDifficulty === level && styles.filterChipTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            {filteredExercises.length} Exercise{filteredExercises.length !== 1 ? 's' : ''}
          </Text>
          {filteredExercises.length > 0 ? (
            filteredExercises.map(exercise => (
              <Card key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseIconBadge, { backgroundColor: exercise.color + '20' }]}>
                    <Ionicons name={exercise.icon as any} size={28} color={exercise.color} />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.exerciseMeta}>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                        <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                          {exercise.difficulty}
                        </Text>
                      </View>
                      <Text style={styles.exerciseCategory}>• {exercise.category}</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                
                <View style={styles.exerciseDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="barbell-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{exercise.equipment}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="body-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{exercise.targetMuscles.join(', ')}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => {
                    // Navigate to start workout with this exercise
                    navigation.navigate('ExerciseSelection');
                  }}
                >
                  <Text style={styles.startButtonText}>Start Workout</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No exercises found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  exercisesSection: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  exerciseCard: {
    marginBottom: SPACING.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  exerciseIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  exerciseCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  exerciseDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  exerciseDetails: {
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    gap: SPACING.xs,
  },
  startButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
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
  },
});
