import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// AI Analysis type for workout summary
export interface AIAnalysisData {
  totalReps: number;
  averageFormScore: number;
  formIssues: string[];
  suggestions: string[];
  duration: number;
  exercise: string;
}

// Workout Stack Param List
export type WorkoutStackParamList = {
  WorkoutHome: undefined;
  ExerciseSelection: undefined;
  LiveWorkout: {
    sessionId: string;
    exercises: string[];
  };
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
    aiAnalysis?: AIAnalysisData;
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
  WorkoutPlan: undefined;
  MealPlan: undefined;
  Plans: { initialTab?: 'workout' | 'meal' };
  ExerciseLibrary: undefined;
};

// Tab Navigator Param List
export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Progress: undefined;
  Profile: undefined;
  Plans: { initialTab?: 'workout' | 'meal' }; // Added Plans screen with optional initialTab param
};

// Root Navigator Param List
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
} & MainTabParamList;

// Workout Stack Navigation Props
export type WorkoutSummaryScreenRouteProp = RouteProp<WorkoutStackParamList, 'WorkoutSummary'>;
export type WorkoutSummaryScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'WorkoutSummary'>;

export type LiveCameraWorkoutScreenRouteProp = RouteProp<WorkoutStackParamList, 'LiveCameraWorkout'>;
export type LiveCameraWorkoutScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'LiveCameraWorkout'>;
