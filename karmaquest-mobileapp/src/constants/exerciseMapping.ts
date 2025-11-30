/**
 * Exercise Mapping Configuration
 * 
 * Maps mobile app exercise names to backend exercise IDs and AI support status.
 * ALL exercises now support AI video analysis with pose detection and rep counting.
 * Categories: Push, Pull, Legs, Core
 */

export interface ExerciseMapping {
  displayName: string;
  backendId: string;
  isAISupported: boolean;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  description?: string;
}

export const EXERCISE_MAPPING: Record<string, ExerciseMapping> = {
  // ===== PUSH EXERCISES =====
  'Push-ups': {
    displayName: 'Push-ups',
    backendId: 'pushups',
    isAISupported: true,
    category: 'Push',
    description: 'AI analyzes elbow angle and counts reps automatically',
  },
  'Bench Press': {
    displayName: 'Bench Press',
    backendId: 'bench_press',
    isAISupported: true,
    category: 'Push',
    description: 'AI analyzes elbow angle and counts reps automatically',
  },
  'Shoulder Press': {
    displayName: 'Shoulder Press',
    backendId: 'shoulder_press',
    isAISupported: true,
    category: 'Push',
    description: 'AI analyzes overhead press form and counts reps',
  },
  'Dips': {
    displayName: 'Dips',
    backendId: 'dips',
    isAISupported: true,
    category: 'Push',
    description: 'AI analyzes dip depth and counts reps automatically',
  },
  'Tricep Extensions': {
    displayName: 'Tricep Extensions',
    backendId: 'tricep_extensions',
    isAISupported: true,
    category: 'Push',
    description: 'AI analyzes elbow flexion and counts reps',
  },

  // ===== PULL EXERCISES =====
  'Pull-ups': {
    displayName: 'Pull-ups',
    backendId: 'pullups',
    isAISupported: true,
    category: 'Pull',
    description: 'AI analyzes pull-up form and counts reps',
  },
  'Rows': {
    displayName: 'Rows',
    backendId: 'rows',
    isAISupported: true,
    category: 'Pull',
    description: 'AI analyzes rowing form and counts reps',
  },
  'Lat Pulldown': {
    displayName: 'Lat Pulldown',
    backendId: 'lat_pulldown',
    isAISupported: true,
    category: 'Pull',
    description: 'AI analyzes pulldown form and counts reps',
  },
  'Face Pulls': {
    displayName: 'Face Pulls',
    backendId: 'face_pulls',
    isAISupported: true,
    category: 'Pull',
    description: 'AI analyzes face pull form and counts reps',
  },
  'Bicep Curls': {
    displayName: 'Bicep Curls',
    backendId: 'bicep_curls',
    isAISupported: true,
    category: 'Pull',
    description: 'AI analyzes curl form and counts reps automatically',
  },

  // ===== LEG EXERCISES =====
  'Squats': {
    displayName: 'Squats',
    backendId: 'squats',
    isAISupported: true,
    category: 'Legs',
    description: 'AI analyzes squat depth and form automatically',
  },
  'Lunges': {
    displayName: 'Lunges',
    backendId: 'lunges',
    isAISupported: true,
    category: 'Legs',
    description: 'AI analyzes lunge depth and counts reps',
  },
  'Leg Press': {
    displayName: 'Leg Press',
    backendId: 'leg_press',
    isAISupported: true,
    category: 'Legs',
    description: 'AI analyzes leg press form and counts reps',
  },
  'Deadlifts': {
    displayName: 'Deadlifts',
    backendId: 'deadlifts',
    isAISupported: true,
    category: 'Legs',
    description: 'AI analyzes hip hinge and counts reps',
  },

  // ===== CORE EXERCISES =====
  'Plank': {
    displayName: 'Plank',
    backendId: 'plank',
    isAISupported: true,
    category: 'Core',
    description: 'AI analyzes body alignment and tracks duration',
  },
  'Crunches': {
    displayName: 'Crunches',
    backendId: 'crunches',
    isAISupported: true,
    category: 'Core',
    description: 'AI analyzes trunk flexion and counts reps',
  },
  'Russian Twists': {
    displayName: 'Russian Twists',
    backendId: 'russian_twists',
    isAISupported: true,
    category: 'Core',
    description: 'AI analyzes rotation and counts reps',
  },
  'Leg Raises': {
    displayName: 'Leg Raises',
    backendId: 'leg_raises',
    isAISupported: true,
    category: 'Core',
    description: 'AI analyzes hip flexion and counts reps',
  },
};

/**
 * Helper function to check if an exercise supports AI analysis
 * Now returns true for ALL exercises
 */
export const isExerciseAISupported = (exerciseName: string): boolean => {
  const mapping = EXERCISE_MAPPING[exerciseName];
  return mapping ? mapping.isAISupported : false;
};

/**
 * Helper function to get backend ID for an exercise
 */
export const getExerciseBackendId = (exerciseName: string): string | null => {
  const mapping = EXERCISE_MAPPING[exerciseName];
  return mapping ? mapping.backendId : null;
};

/**
 * Helper function to get all AI-supported exercises
 */
export const getAISupportedExercises = (): ExerciseMapping[] => {
  return Object.values(EXERCISE_MAPPING).filter(ex => ex.isAISupported);
};

/**
 * Helper function to get exercises by category
 */
export const getExercisesByCategory = (category: 'Push' | 'Pull' | 'Legs' | 'Core'): ExerciseMapping[] => {
  return Object.values(EXERCISE_MAPPING).filter(ex => ex.category === category);
};
