// Colors
export const COLORS = {
  primary: '#6C63FF',
  secondary: '#FF6584',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',

  border: '#E0E0E0',
  disabled: '#9E9E9E',

  // Exercise colors
  squat: '#FF6B6B',
  pushup: '#4ECDC4',
  lunge: '#FFE66D',
  plank: '#95E1D3',
  deadlift: '#F38181',

  // Gradient colors
  gradientStart: '#667eea',
  gradientEnd: '#764ba2',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Layout
export const LAYOUT = {
  // Adjust this value to control top padding for notch/camera
  // 0 = no extra padding (content starts right below status bar)
  // Increase in increments of 5 if you need more space
  TOP_SAFE_PADDING: 15, // Change this number to adjust: try 0, 5, 10, 15, 20, etc.
};

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// Exercise Data
export const EXERCISE_INFO = {
  squat: {
    name: 'Squats',
    description: 'Lower body exercise targeting quads, hamstrings, and glutes',
    caloriesPerRep: 0.32,
    muscleGroups: ['Quads', 'Hamstrings', 'Glutes'],
    difficulty: 'beginner',
    icon: '🏋️',
  },
  pushup: {
    name: 'Push-ups',
    description: 'Upper body exercise targeting chest, shoulders, and triceps',
    caloriesPerRep: 0.29,
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'beginner',
    icon: '💪',
  },
  lunge: {
    name: 'Lunges',
    description: 'Lower body exercise for legs and balance',
    caloriesPerRep: 0.30,
    muscleGroups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    difficulty: 'intermediate',
    icon: '🦵',
  },
  plank: {
    name: 'Planks',
    description: 'Core strengthening isometric exercise',
    caloriesPerSecond: 0.10,
    muscleGroups: ['Core', 'Shoulders', 'Back'],
    difficulty: 'beginner',
    icon: '🧘',
  },
  deadlift: {
    name: 'Deadlifts',
    description: 'Full body compound exercise',
    caloriesPerRep: 0.45,
    muscleGroups: ['Back', 'Hamstrings', 'Glutes', 'Core'],
    difficulty: 'advanced',
    icon: '🏋️‍♂️',
  },
};

// Exercises by name (for workout selection)
export const EXERCISES: Record<string, { muscleGroup: string; difficulty: string }> = {
  'Push-ups': { muscleGroup: 'Chest, Triceps', difficulty: 'Beginner' },
  'Bench Press': { muscleGroup: 'Chest', difficulty: 'Intermediate' },
  'Shoulder Press': { muscleGroup: 'Shoulders', difficulty: 'Intermediate' },
  'Dips': { muscleGroup: 'Chest, Triceps', difficulty: 'Intermediate' },
  'Tricep Extensions': { muscleGroup: 'Triceps', difficulty: 'Beginner' },
  'Pull-ups': { muscleGroup: 'Back, Biceps', difficulty: 'Advanced' },
  'Rows': { muscleGroup: 'Back', difficulty: 'Intermediate' },
  'Lat Pulldown': { muscleGroup: 'Back', difficulty: 'Beginner' },
  'Face Pulls': { muscleGroup: 'Rear Delts', difficulty: 'Beginner' },
  'Squats': { muscleGroup: 'Legs', difficulty: 'Intermediate' },
  'Lunges': { muscleGroup: 'Legs', difficulty: 'Beginner' },
  'Leg Press': { muscleGroup: 'Legs', difficulty: 'Beginner' },
  'Deadlifts': { muscleGroup: 'Back, Legs', difficulty: 'Advanced' },
  'Plank': { muscleGroup: 'Core', difficulty: 'Beginner' },
  'Crunches': { muscleGroup: 'Core', difficulty: 'Beginner' },
  'Russian Twists': { muscleGroup: 'Core', difficulty: 'Intermediate' },
  'Leg Raises': { muscleGroup: 'Core', difficulty: 'Intermediate' },
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'development' ? 'http://10.13.127.205:5000/api' : 'https://your-production-api.com/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@karmaquest:access_token',
  REFRESH_TOKEN: '@karmaquest:refresh_token',
  USER_DATA: '@karmaquest:user_data',
  USER_PROFILE: '@karmaquest:user_profile',
  USER_ROLE: '@karmaquest:user_role',
  OFFLINE_SESSIONS: '@karmaquest:offline_sessions',
  SETTINGS: '@karmaquest:settings',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'KarmaQuest',
  VERSION: '1.0.0',
  MIN_PASSWORD_LENGTH: 8,
  SESSION_TIMEOUT: 7200000, // 2 hours in milliseconds
  MAX_OFFLINE_SESSIONS: 10,
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  API: 'YYYY-MM-DD',
  TIME: 'hh:mm A',
  DATETIME: 'MMM DD, YYYY hh:mm A',
};

// Chart Colors
export const CHART_COLORS = [
  '#6C63FF',
  '#FF6584',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
];

// Fitness Goals
export const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '⬇️' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { value: 'maintenance', label: 'Maintenance', icon: '⚖️' },
];

// Fitness Levels
export const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to fitness' },
  { value: 'intermediate', label: 'Intermediate', description: '6-12 months experience' },
  { value: 'advanced', label: 'Advanced', description: '1+ years experience' },
];

// Days of Week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Meal Types
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { value: 'lunch', label: 'Lunch', icon: '🥗' },
  { value: 'dinner', label: 'Dinner', icon: '🍽️' },
  { value: 'snack', label: 'Snack', icon: '🍎' },
];

export default {
  COLORS,
  SPACING,
  FONT_SIZES,
  EXERCISE_INFO,
  API_CONFIG,
  STORAGE_KEYS,
  APP_CONFIG,
  VALIDATION_PATTERNS,
  DATE_FORMATS,
  CHART_COLORS,
  FITNESS_GOALS,
  FITNESS_LEVELS,
  DAYS_OF_WEEK,
  MEAL_TYPES,
};
