// User Types
export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  role?: 'user' | 'trainer' | 'admin';
  trainer_specialization?: string;
  assigned_users?: string[];
}

export interface UserProfile {
  profile_id: string;
  user_id: string;
  current_weight?: number;
  height?: number;
  target_weight?: number;
  fitness_goal?: 'weight_loss' | 'muscle_gain' | 'maintenance';
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  medical_conditions?: string[];
  preferences?: Record<string, any>;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  profile?: UserProfile;
}

// Workout Types
export type ExerciseType = 'squat' | 'pushup' | 'lunge' | 'plank' | 'deadlift';

export interface WorkoutSession {
  id?: string;
  session_id?: string;
  user_id: string;
  session_date?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  actual_duration?: number;
  total_exercises?: number;
  total_reps?: number;
  total_calories?: number;
  calories_burned?: number;
  avg_posture_score?: number;
  session_notes?: string;
  notes?: string;
  workout_type?: string;
  planned_exercises?: string[];
  status?: 'in_progress' | 'completed';
}

export interface ExerciseLog {
  id?: string;
  log_id?: string;
  session_id: string;
  exercise_type?: ExerciseType;
  exercise_name?: string;
  correct_reps?: number;
  incorrect_reps?: number;
  total_reps?: number;
  reps?: number;
  sets?: number;
  weight?: number;
  avg_form_score?: number;
  duration_seconds?: number;
  duration?: number;
  calories_burned?: number;
  posture_issues?: string[];
}

export interface ExerciseData {
  type: ExerciseType;
  reps: number;
  sets?: number;
  duration_seconds?: number;
  rest_seconds?: number;
}

// Progress Types
export interface UserProgress {
  progress_id: string;
  user_id: string;
  date: string;
  weight?: number;
  body_measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  progress_photo_url?: string;
  notes?: string;
}

export interface ProgressStats {
  total_workouts: number;
  total_calories: number;
  avg_posture_score: number;
  current_streak: number;
  best_streak: number;
  favorite_exercise?: ExerciseType;
  total_reps: number;
  weight_change?: number;
}

// Plan Types
export interface DailyWorkoutPlan {
  day: string;
  exercises: ExerciseData[];
  focus_area?: string;
  estimated_duration_minutes: number;
}

export interface WeeklyWorkoutPlan {
  plan_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  plan_data: DailyWorkoutPlan[];
  is_active: boolean;
  created_at: string;
}

export interface MealData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface DailyMealPlan {
  day: string;
  meals: MealData[];
  total_calories: number;
}

export interface WeeklyMealPlan {
  meal_plan_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  plan_data: DailyMealPlan[];
  total_calories_per_day: number;
  dietary_preferences?: string[];
  is_active: boolean;
  created_at: string;
}

// Notification Types
export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'workout_reminder' | 'meal_reminder' | 'achievement';
  title: string;
  message: string;
  scheduled_time?: string;
  is_sent: boolean;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type WorkoutStackParamList = {
  WorkoutHome: undefined;
  ExerciseSelection: undefined;
  LiveWorkout: { sessionId: string; exercises: string[] };
  LiveCameraWorkout: { 
    sessionId: string; 
    exercise: string; 
    targetSets: number; 
    targetReps: number; 
  };
  AIVideoWorkout: {
    sessionId: string;
    exerciseName: string;
  };
  WorkoutSummary: { 
    sessionId: string;
    exerciseName?: string;
    videoUrl?: string;
    totalReps?: number;
    duration?: number;
    formScore?: number;
    formIssues?: string[];
    formSuggestions?: string[];
    totalSets?: number;
    caloriesBurned?: number;
  };
};
