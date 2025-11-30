/**
 * Workout Calculations Utility
 * 
 * Provides functions for calculating workout metrics:
 * - Calories burned (hybrid MET + rep-based approach)
 * - Sets from total reps
 */

/**
 * MET (Metabolic Equivalent of Task) values for exercises
 * Source: Compendium of Physical Activities
 */
export const EXERCISE_MET_VALUES: Record<string, number> = {
  // Push exercises
  pushups: 8.0,
  bench_press: 6.0,
  shoulder_press: 6.0,
  dips: 8.0,
  
  // Pull exercises
  pullup: 8.0,
  bicep_curls: 5.0,
  rows: 6.0,
  lat_pulldown: 5.5,
  face_pulls: 4.5,
  
  // Leg exercises
  squats: 8.0,
  lunges: 6.0,
  leg_press: 6.0,
  deadlift: 8.0,
  
  // Core exercises
  plank: 4.0,
  crunches: 5.0,
  russian_twists: 5.5,
  leg_raises: 6.0,
  
  // Cardio exercises
  running: 10.0,
  cycling: 8.0,
  jump_rope: 12.0,
  burpees: 10.0,
};

/**
 * Average calories burned per rep for different exercises
 * Based on average body weight of 70kg (154 lbs)
 */
export const CALORIES_PER_REP: Record<string, number> = {
  // Push exercises
  pushups: 0.29,
  bench_press: 0.32,
  shoulder_press: 0.30,
  dips: 0.35,
  
  // Pull exercises
  pullup: 0.40,
  bicep_curls: 0.25,
  rows: 0.30,
  lat_pulldown: 0.28,
  face_pulls: 0.22,
  
  // Leg exercises
  squats: 0.32,
  lunges: 0.30,
  leg_press: 0.35,
  deadlift: 0.45,
  
  // Core exercises
  plank: 0.15, // per second for isometric holds
  crunches: 0.20,
  russian_twists: 0.23,
  leg_raises: 0.25,
  
  // Cardio exercises
  running: 0.50, // per second
  cycling: 0.40, // per second
  jump_rope: 0.13,
  burpees: 0.50,
};

/**
 * Calculate calories burned using hybrid approach
 * Combines MET-based time calculation with rep-based estimation
 * 
 * Formula: 
 * - MET-based: (MET * weight * duration_hours)
 * - Rep-based: (reps * calories_per_rep)
 * - Result: Average of both methods
 * 
 * @param exerciseBackendId - Backend exercise ID (e.g., 'squat', 'pushup')
 * @param reps - Total number of reps performed
 * @param durationSeconds - Workout duration in seconds
 * @param userWeightKg - User's weight in kilograms (default: 70kg)
 * @returns Calories burned (rounded to 1 decimal)
 */
export const calculateCaloriesBurned = (
  exerciseBackendId: string,
  reps: number,
  durationSeconds: number,
  userWeightKg: number = 70
): number => {
  const metValue = EXERCISE_MET_VALUES[exerciseBackendId] || 6.0;
  const caloriesPerRep = CALORIES_PER_REP[exerciseBackendId] || 0.30;
  
  // Method 1: MET-based calculation
  // Formula: MET * weight(kg) * time(hours)
  const durationHours = durationSeconds / 3600;
  const caloriesFromMET = metValue * userWeightKg * durationHours;
  
  // Method 2: Rep-based calculation
  const caloriesFromReps = reps * caloriesPerRep;
  
  // Hybrid approach: Average of both methods
  // This provides more accurate results by considering both intensity and volume
  const hybridCalories = (caloriesFromMET + caloriesFromReps) / 2;
  
  // Return rounded value
  return Math.round(hybridCalories * 10) / 10;
};

/**
 * Calculate number of sets from total reps
 * Default: 1 set = 10 reps
 * 
 * @param totalReps - Total number of reps performed
 * @param repsPerSet - Number of reps per set (default: 10)
 * @returns Number of sets (rounded up)
 */
export const calculateSetsFromReps = (
  totalReps: number,
  repsPerSet: number = 10
): number => {
  if (totalReps <= 0 || repsPerSet <= 0) return 0;
  return Math.ceil(totalReps / repsPerSet);
};

/**
 * Calculate average reps per set
 * 
 * @param totalReps - Total number of reps performed
 * @param sets - Number of sets
 * @returns Average reps per set (rounded to 1 decimal)
 */
export const calculateAvgRepsPerSet = (
  totalReps: number,
  sets: number
): number => {
  if (sets <= 0) return 0;
  return Math.round((totalReps / sets) * 10) / 10;
};

/**
 * Calculate workout intensity based on reps and duration
 * Returns a score from 0-100
 * 
 * @param reps - Total reps performed
 * @param durationSeconds - Workout duration in seconds
 * @returns Intensity score (0-100)
 */
export const calculateWorkoutIntensity = (
  reps: number,
  durationSeconds: number
): number => {
  if (durationSeconds <= 0) return 0;
  
  // Calculate reps per minute
  const repsPerMinute = (reps / durationSeconds) * 60;
  
  // Intensity scale:
  // - Low: 0-10 reps/min -> 0-40 score
  // - Medium: 10-20 reps/min -> 40-70 score
  // - High: 20+ reps/min -> 70-100 score
  let intensityScore = 0;
  
  if (repsPerMinute <= 10) {
    intensityScore = (repsPerMinute / 10) * 40;
  } else if (repsPerMinute <= 20) {
    intensityScore = 40 + ((repsPerMinute - 10) / 10) * 30;
  } else {
    intensityScore = 70 + Math.min(((repsPerMinute - 20) / 10) * 30, 30);
  }
  
  return Math.round(Math.min(intensityScore, 100));
};

/**
 * Format duration in seconds to readable string
 * Examples: "1m 30s", "45s", "10.3s"
 * 
 * @param seconds - Duration in seconds (can be float)
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    // For seconds only, show 1 decimal place if it's a float
    const roundedSeconds = Math.round(remainingSeconds * 10) / 10;
    return `${roundedSeconds}s`;
  }
  
  // For minutes + seconds, round seconds to nearest integer
  const roundedSeconds = Math.round(remainingSeconds);
  return `${minutes}m ${roundedSeconds}s`;
};

/**
 * Estimate rest time between sets
 * Based on total duration and number of sets
 * 
 * @param totalDurationSeconds - Total workout duration
 * @param sets - Number of sets
 * @param avgSetDuration - Average time per set in seconds (default: 30s)
 * @returns Average rest time between sets in seconds
 */
export const estimateRestTime = (
  totalDurationSeconds: number,
  sets: number,
  avgSetDuration: number = 30
): number => {
  if (sets <= 1) return 0;
  
  const totalWorkTime = sets * avgSetDuration;
  const totalRestTime = totalDurationSeconds - totalWorkTime;
  const restPerSet = totalRestTime / (sets - 1);
  
  return Math.max(0, Math.round(restPerSet));
};

/**
 * Calculate volume (total work done)
 * Volume = Reps × Weight
 * For bodyweight exercises, estimate weight based on exercise type
 * 
 * @param reps - Total reps
 * @param weightKg - Weight used (optional, for weighted exercises)
 * @param exerciseType - Exercise type to estimate bodyweight percentage
 * @param userWeightKg - User's body weight in kg
 * @returns Volume in kg
 */
export const calculateVolume = (
  reps: number,
  weightKg: number | null,
  exerciseType: string,
  userWeightKg: number = 70
): number => {
  // If weight is provided, use it directly
  if (weightKg !== null && weightKg > 0) {
    return reps * weightKg;
  }
  
  // For bodyweight exercises, estimate percentage of body weight used
  const bodyweightPercentages: Record<string, number> = {
    pushup: 0.65,
    pullup: 0.95,
    dips: 0.85,
    squat: 0.70,
    lunge: 0.50,
    plank: 0.60,
  };
  
  const percentage = bodyweightPercentages[exerciseType] || 0.60;
  const effectiveWeight = userWeightKg * percentage;
  
  return Math.round(reps * effectiveWeight);
};
