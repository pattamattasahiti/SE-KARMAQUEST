"""
Dynamic Plan Generator - AI-driven workout and meal plan generation
Generates personalized 7-day plans based on actual workout performance data
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import math
from app.models.workout import WorkoutSession, ExerciseLog
from app.models.user import User


class DynamicPlanGenerator:
    """
    Generates personalized workout and meal plans based on:
    - Exercise performance (reps, sets, form score)
    - Workout metrics (duration, calories, intensity)
    - Historical data and progress trends
    - User fitness goals
    """
    
    # Exercise categories and variations
    EXERCISE_DATABASE = {
        'Push': {
            'primary': ['Push-ups', 'Bench Press', 'Shoulder Press'],
            'accessory': ['Dips', 'Tricep Extensions'],
            'difficulty_progression': ['Push-ups', 'Bench Press', 'Dips']
        },
        'Pull': {
            'primary': ['Pull-ups', 'Rows', 'Lat Pulldown'],
            'accessory': ['Face Pulls', 'Bicep Curls'],
            'difficulty_progression': ['Lat Pulldown', 'Rows', 'Pull-ups']
        },
        'Legs': {
            'primary': ['Squats', 'Deadlifts', 'Lunges'],
            'accessory': ['Leg Press'],
            'difficulty_progression': ['Leg Press', 'Squats', 'Deadlifts']
        },
        'Core': {
            'primary': ['Plank', 'Crunches', 'Leg Raises'],
            'accessory': ['Russian Twists'],
            'difficulty_progression': ['Crunches', 'Plank', 'Leg Raises']
        }
    }
    
    @classmethod
    def generate_plans_from_workout(cls, user_id: str) -> Dict:
        """
        Generate plans from the most recent workout in history
        Used by the "Generate New Plan" button
        
        Returns:
            {
                'success': bool,
                'workout_plan': WeeklyWorkoutPlan object or None,
                'meal_plan': WeeklyMealPlan object or None,
                'message': str
            }
        """
        from app import db
        from app.models.plan import WeeklyWorkoutPlan, WeeklyMealPlan
        
        # Get most recent completed workout
        latest_session = WorkoutSession.query.filter_by(user_id=user_id)\
            .order_by(WorkoutSession.session_date.desc())\
            .first()
        
        if not latest_session or not latest_session.exercises:
            print(f"[DynamicPlan] No workout history found for user {user_id}")
            return {
                'success': False,
                'workout_plan': None,
                'meal_plan': None,
                'message': 'Complete a workout first to generate personalized plans!'
            }
        
        # Extract workout data from latest session
        primary_exercise = latest_session.exercises[0]
        
        # Map exercise to category
        exercise_category_map = {
            # Push exercises
            'pushups': 'Push', 'push-ups': 'Push', 'push_ups': 'Push',
            'bench_press': 'Push', 'benchpress': 'Push',
            'shoulder_press': 'Push', 'shoulderpress': 'Push',
            'dips': 'Push', 'tricep_extensions': 'Push', 'tricep_extension': 'Push',
            # Pull exercises
            'pullups': 'Pull', 'pull-ups': 'Pull', 'pull_ups': 'Pull',
            'rows': 'Pull', 'row': 'Pull', 'bent_over_row': 'Pull',
            'lat_pulldown': 'Pull', 'latpulldown': 'Pull',
            'face_pulls': 'Pull', 'facepulls': 'Pull', 'face_pull': 'Pull',
            'bicep_curls': 'Pull', 'bicep_curl': 'Pull', 'bicepcurls': 'Pull',
            # Legs exercises
            'squats': 'Legs', 'squat': 'Legs',
            'lunges': 'Legs', 'lunge': 'Legs',
            'leg_press': 'Legs', 'legpress': 'Legs',
            'deadlifts': 'Legs', 'deadlift': 'Legs',
            # Core exercises
            'plank': 'Core', 'planks': 'Core',
            'crunches': 'Core', 'crunch': 'Core',
            'russian_twists': 'Core', 'russian_twist': 'Core', 'russiantwists': 'Core',
            'leg_raises': 'Core', 'leg_raise': 'Core', 'legraises': 'Core'
        }
        
        workout_data = {
            'total_reps': latest_session.total_reps or 0,
            'sets': primary_exercise.sets or 1,
            'form_score': latest_session.avg_posture_score or 70,
            'duration_seconds': latest_session.duration_seconds or 0,
            'calories_burned': latest_session.total_calories or 0,
            'exercise_type': primary_exercise.exercise_type,
            'exercise_category': exercise_category_map.get(
                primary_exercise.exercise_type.lower().replace(' ', '_'), 
                'Full Body'
            )
        }
        
        print(f"[DynamicPlan] 🎯 Latest workout: {primary_exercise.exercise_type}")
        print(f"[DynamicPlan] 🎯 Category: {workout_data['exercise_category']}")
        print(f"[DynamicPlan] Generating plans from workout data: {workout_data}")
        
        # Generate plans
        try:
            workout_plan_data, meal_plan_data = cls.generate_dynamic_plans(user_id, workout_data)
            
            # Save to database
            start_date = datetime.utcnow().date()
            end_date = start_date + timedelta(days=6)
            
            # Deactivate old plans
            WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            WeeklyMealPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            
            # Create new workout plan
            workout_plan = WeeklyWorkoutPlan(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                plan_data=workout_plan_data,
                is_active=True
            )
            db.session.add(workout_plan)
            
            # Create new meal plan
            meal_plan = WeeklyMealPlan(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                plan_data=meal_plan_data,
                is_active=True
            )
            db.session.add(meal_plan)
            
            db.session.commit()
            
            print(f"[DynamicPlan] ✅ Plans generated and saved successfully")
            
            return {
                'success': True,
                'workout_plan': workout_plan,
                'meal_plan': meal_plan,
                'message': f'Plans generated based on your {workout_data["exercise_category"]} workout!'
            }
            
        except Exception as e:
            db.session.rollback()
            print(f"[DynamicPlan] ❌ Error generating plans: {str(e)}")
            import traceback
            print(f"[DynamicPlan] Traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'workout_plan': None,
                'meal_plan': None,
                'message': f'Error generating plans: {str(e)}'
            }
    
    @classmethod
    def generate_dynamic_plans(cls, user_id: str, workout_data: Dict) -> Tuple[Dict, Dict]:
        """
        Main entry point - generates both workout and meal plans
        
        Args:
            user_id: User identifier
            workout_data: Latest workout performance data
                {
                    'total_reps': int,
                    'sets': int,
                    'form_score': float (0-100),
                    'duration_seconds': int,
                    'calories_burned': float,
                    'exercise_type': str,
                    'exercise_category': str
                }
        
        Returns:
            (workout_plan, meal_plan) tuple
        """
        # Analyze user's fitness profile from history
        fitness_profile = cls._analyze_fitness_profile(user_id, workout_data)
        
        # Generate workout plan
        workout_plan = cls._generate_workout_plan(fitness_profile)
        
        # Generate meal plan
        meal_plan = cls._generate_meal_plan(fitness_profile)
        
        return workout_plan, meal_plan
    
    @classmethod
    def _analyze_fitness_profile(cls, user_id: str, latest_workout: Dict) -> Dict:
        """Analyze user's fitness level and capabilities from workout history"""
        
        # Get recent workout history (last 30 days)
        recent_sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .filter(WorkoutSession.session_date >= datetime.utcnow() - timedelta(days=30))\
            .order_by(WorkoutSession.session_date.desc())\
            .all()
        
        # Initialize profile with latest workout data
        profile = {
            'user_id': user_id,
            'latest_workout': latest_workout,
            'total_workouts': len(recent_sessions),
            'avg_form_score': latest_workout.get('form_score', 70),
            'avg_calories_per_workout': latest_workout.get('calories_burned', 100),
            'avg_duration': latest_workout.get('duration_seconds', 300),
            'fitness_level': 'beginner',
            'strengths': [],
            'weaknesses': [],
            'preferred_exercises': [],
            'workout_frequency': 0,
            'intensity_level': 'moderate',
            'tdee': 2000,  # Will be calculated
            'fitness_goal': 'maintenance'
        }
        
        if not recent_sessions:
            return profile
        
        # Calculate averages from history
        total_form = 0
        total_calories = 0
        total_duration = 0
        exercise_performance = {}
        
        for session in recent_sessions:
            if session.avg_posture_score:
                total_form += session.avg_posture_score
            if session.total_calories:
                total_calories += session.total_calories
            if session.duration_seconds:
                total_duration += session.duration_seconds
            
            # Track performance by exercise
            for exercise in session.exercises:
                ex_type = exercise.exercise_type
                if ex_type not in exercise_performance:
                    exercise_performance[ex_type] = {
                        'count': 0,
                        'total_reps': 0,
                        'total_sets': 0,
                        'avg_form': 0
                    }
                exercise_performance[ex_type]['count'] += 1
                exercise_performance[ex_type]['total_reps'] += exercise.total_reps or 0
                exercise_performance[ex_type]['total_sets'] += exercise.sets or 0
                exercise_performance[ex_type]['avg_form'] += exercise.avg_form_score or 0
        
        # Calculate averages
        num_sessions = len(recent_sessions)
        profile['avg_form_score'] = total_form / num_sessions if num_sessions > 0 else 70
        profile['avg_calories_per_workout'] = total_calories / num_sessions if num_sessions > 0 else 100
        profile['avg_duration'] = total_duration / num_sessions if num_sessions > 0 else 300
        profile['workout_frequency'] = num_sessions  # Last 30 days
        
        # Determine fitness level based on multiple factors
        profile['fitness_level'] = cls._determine_fitness_level(
            profile['total_workouts'],
            profile['avg_form_score'],
            profile['workout_frequency'],
            latest_workout.get('total_reps', 0)
        )
        
        # Identify strengths and weaknesses
        for ex_type, perf in exercise_performance.items():
            avg_form = perf['avg_form'] / perf['count'] if perf['count'] > 0 else 0
            avg_reps = perf['total_reps'] / perf['count'] if perf['count'] > 0 else 0
            
            if avg_form >= 85:
                profile['strengths'].append(ex_type)
            elif avg_form < 60:
                profile['weaknesses'].append(ex_type)
            
            if perf['count'] >= 5:
                profile['preferred_exercises'].append(ex_type)
        
        # Determine intensity level
        if profile['avg_calories_per_workout'] > 200:
            profile['intensity_level'] = 'high'
        elif profile['avg_calories_per_workout'] > 120:
            profile['intensity_level'] = 'moderate'
        else:
            profile['intensity_level'] = 'low'
        
        # Calculate TDEE based on workout data
        profile['tdee'] = cls._calculate_tdee(
            profile['avg_calories_per_workout'],
            profile['workout_frequency'],
            profile['avg_duration']
        )
        
        # Get user's fitness goal from profile
        user = User.query.get(user_id)
        if user and user.profile:
            profile['fitness_goal'] = user.profile.fitness_goal or 'maintenance'
        
        return profile
    
    @classmethod
    def _determine_fitness_level(cls, total_workouts: int, avg_form: float, 
                                 frequency: int, latest_reps: int) -> str:
        """Determine fitness level from multiple metrics"""
        score = 0
        
        # Workout consistency (0-30 points)
        if frequency >= 20:
            score += 30
        elif frequency >= 12:
            score += 20
        elif frequency >= 6:
            score += 10
        
        # Form quality (0-30 points)
        if avg_form >= 85:
            score += 30
        elif avg_form >= 75:
            score += 20
        elif avg_form >= 65:
            score += 10
        
        # Performance volume (0-20 points)
        if latest_reps >= 15:
            score += 20
        elif latest_reps >= 10:
            score += 15
        elif latest_reps >= 5:
            score += 10
        
        # Total experience (0-20 points)
        if total_workouts >= 30:
            score += 20
        elif total_workouts >= 15:
            score += 15
        elif total_workouts >= 5:
            score += 10
        
        # Determine level
        if score >= 70:
            return 'advanced'
        elif score >= 40:
            return 'intermediate'
        else:
            return 'beginner'
    
    @classmethod
    def _calculate_tdee(cls, avg_calories_per_workout: float, 
                       workout_frequency: int, avg_duration: int) -> int:
        """Calculate Total Daily Energy Expenditure"""
        # Base metabolic rate (simplified Harris-Benedict for average adult)
        bmr = 1800  # Average BMR
        
        # Activity factor based on workout frequency (last 30 days)
        if workout_frequency >= 20:  # 5+ times per week
            activity_multiplier = 1.725  # Very active
        elif workout_frequency >= 12:  # 3-4 times per week
            activity_multiplier = 1.55  # Moderately active
        elif workout_frequency >= 6:  # 1-2 times per week
            activity_multiplier = 1.375  # Lightly active
        else:
            activity_multiplier = 1.2  # Sedentary
        
        # Calculate TDEE
        tdee = bmr * activity_multiplier
        
        # Adjust for workout intensity (calories per minute)
        if avg_duration > 0:
            calories_per_minute = avg_calories_per_workout / (avg_duration / 60)
            if calories_per_minute > 10:  # High intensity
                tdee += 200
            elif calories_per_minute > 6:  # Moderate intensity
                tdee += 100
        
        return int(tdee)
    
    @classmethod
    def _generate_workout_plan(cls, profile: Dict) -> Dict:
        """Generate personalized 7-day workout plan"""
        fitness_level = profile['fitness_level']
        latest_workout = profile['latest_workout']
        exercise_type = latest_workout.get('exercise_type', 'squats')
        exercise_category = latest_workout.get('exercise_category', 'Legs')
        
        # Determine sets and reps based on performance
        base_sets, base_reps = cls._calculate_volume_targets(
            fitness_level,
            latest_workout.get('sets', 3),
            latest_workout.get('total_reps', 10),
            latest_workout.get('form_score', 70)
        )
        
        # Create 7-day plan
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        plan_data = {'days': []}
        
        # 🎯 PERSONALIZE workout split based on exercise category completed
        print(f"[WorkoutPlan] 🎯 Personalizing workout plan based on category: {exercise_category}")
        
        # Workout split based on fitness level AND exercise category
        if fitness_level == 'beginner':
            # 3-day split - emphasize the category they completed
            if exercise_category == 'Push':
                workout_pattern = ['push', 'rest', 'pull', 'rest', 'push', 'rest', 'rest']
            elif exercise_category == 'Pull':
                workout_pattern = ['pull', 'rest', 'push', 'rest', 'pull', 'rest', 'rest']
            elif exercise_category == 'Legs':
                workout_pattern = ['legs', 'rest', 'upper', 'rest', 'legs', 'rest', 'rest']
            elif exercise_category == 'Core':
                workout_pattern = ['full', 'rest', 'full', 'rest', 'full', 'rest', 'rest']  # Core mixed with full body
            else:  # Full Body
                workout_pattern = ['full', 'rest', 'full', 'rest', 'full', 'rest', 'rest']
                
        elif fitness_level == 'intermediate':
            # 4-day split - emphasize the category they completed
            if exercise_category == 'Push':
                workout_pattern = ['push', 'legs', 'rest', 'push', 'pull', 'rest', 'active']
            elif exercise_category == 'Pull':
                workout_pattern = ['pull', 'legs', 'rest', 'pull', 'push', 'rest', 'active']
            elif exercise_category == 'Legs':
                workout_pattern = ['legs', 'upper', 'rest', 'legs', 'push', 'rest', 'active']
            elif exercise_category == 'Core':
                workout_pattern = ['full', 'lower', 'rest', 'full', 'lower', 'rest', 'active']
            else:  # Full Body
                workout_pattern = ['upper', 'lower', 'rest', 'upper', 'lower', 'rest', 'active']
                
        else:  # advanced
            # 5-day split - emphasize the category they completed
            if exercise_category == 'Push':
                workout_pattern = ['push', 'legs', 'push', 'pull', 'push', 'rest', 'active']  # 3x Push
            elif exercise_category == 'Pull':
                workout_pattern = ['pull', 'legs', 'pull', 'push', 'pull', 'rest', 'active']  # 3x Pull
            elif exercise_category == 'Legs':
                workout_pattern = ['legs', 'push', 'legs', 'pull', 'legs', 'rest', 'active']  # 3x Legs
            elif exercise_category == 'Core':
                workout_pattern = ['full', 'pull', 'full', 'push', 'full', 'rest', 'active']  # 3x Full body
            else:  # Full Body
                workout_pattern = ['push', 'pull', 'legs', 'push', 'pull', 'rest', 'active']
        
        print(f"[WorkoutPlan] Workout pattern: {workout_pattern}")
        
        for day_idx, day_name in enumerate(days):
            workout_type = workout_pattern[day_idx]
            
            if workout_type == 'rest':
                plan_data['days'].append({
                    'day': day_name,
                    'type': 'Rest Day',
                    'exercises': [],
                    'notes': 'Focus on recovery, hydration, and sleep'
                })
            elif workout_type == 'active':
                plan_data['days'].append({
                    'day': day_name,
                    'type': 'Active Recovery',
                    'exercises': [
                        {'name': 'Light Walking', 'duration': '20 mins', 'intensity': 'low'},
                        {'name': 'Stretching', 'duration': '15 mins', 'intensity': 'low'}
                    ],
                    'notes': 'Light activity to promote blood flow and recovery'
                })
            else:
                # Generate workout for this day
                exercises = cls._generate_day_exercises(
                    workout_type, fitness_level, base_sets, base_reps,
                    profile['strengths'], profile['weaknesses'],
                    latest_workout.get('exercise_type')
                )
                
                plan_data['days'].append({
                    'day': day_name,
                    'type': workout_type.capitalize() + ' Day',
                    'exercises': exercises,
                    'notes': cls._generate_workout_notes(workout_type, fitness_level)
                })
        
        return plan_data
    
    @classmethod
    def _calculate_volume_targets(cls, fitness_level: str, current_sets: int,
                                  current_reps: int, form_score: float) -> Tuple[int, int]:
        """Calculate progressive overload targets"""
        # Base targets by fitness level
        base_targets = {
            'beginner': (3, 10),
            'intermediate': (4, 12),
            'advanced': (4, 15)
        }
        
        base_sets, base_reps = base_targets.get(fitness_level, (3, 10))
        
        # Apply progressive overload if form is good
        if form_score >= 80:
            # Good form - increase volume by 10%
            target_reps = min(int(current_reps * 1.1), base_reps + 5)
            target_sets = current_sets if current_reps < base_reps else min(current_sets + 1, 5)
        elif form_score >= 65:
            # Acceptable form - maintain current volume
            target_reps = current_reps
            target_sets = current_sets
        else:
            # Poor form - reduce volume, focus on technique
            target_reps = max(int(current_reps * 0.8), 5)
            target_sets = max(current_sets - 1, 2)
        
        return target_sets, target_reps
    
    @classmethod
    def _generate_day_exercises(cls, workout_type: str, fitness_level: str,
                                base_sets: int, base_reps: int, strengths: List,
                                weaknesses: List, recent_exercise: Optional[str]) -> List[Dict]:
        """Generate 3-5 exercises per day ONLY - spread workouts across the week"""
        exercises = []
        
        # Map workout types to categories
        type_category_map = {
            'full': ['Push', 'Pull', 'Legs', 'Core'],
            'upper': ['Push', 'Pull'],
            'lower': ['Legs', 'Core'],
            'push': ['Push'],
            'pull': ['Pull'],
            'legs': ['Legs', 'Core']
        }
        
        categories = type_category_map.get(workout_type, ['Push'])
        
        # LIMIT: Only 3-5 exercises total per day (not per category!)
        max_exercises = 3 if fitness_level == 'beginner' else (4 if fitness_level == 'intermediate' else 5)
        exercises_added = 0
        
        # Distribute exercises across categories
        exercises_per_category = max(1, max_exercises // len(categories))
        
        for category in categories:
            if exercises_added >= max_exercises:
                break
                
            # Select exercises from category
            category_exercises = cls.EXERCISE_DATABASE.get(category, {})
            primary = category_exercises.get('primary', [])
            accessory = category_exercises.get('accessory', [])
            all_exercises = primary + accessory
            
            # Add 1-2 exercises from this category
            category_limit = min(exercises_per_category, max_exercises - exercises_added)
            added_from_category = 0
            
            # Prioritize weaknesses first
            for exercise in all_exercises:
                if added_from_category >= category_limit:
                    break
                    
                ex_lower = exercise.lower().replace(' ', '_').replace('-', '_')
                
                # Prioritize exercises in weakness list
                if any(w.lower() in ex_lower for w in weaknesses):
                    sets = base_sets
                    reps = base_reps
                    
                    # Adjust based on exercise type
                    if exercise.lower() in ['squats', 'deadlifts']:
                        reps = max(int(base_reps * 0.75), 6)
                        sets = min(base_sets + 1, 5)
                        notes = '🏋️ Heavy compound - focus on explosive power'
                    elif exercise.lower() in ['pull-ups', 'dips']:
                        reps = max(int(base_reps * 0.6), 5)
                        notes = '🎯 Use assistance if needed - full range of motion'
                    elif exercise.lower() == 'plank':
                        reps = 1
                        sets = 3
                        notes = f'⏱️ Hold for {30 + (fitness_level == "advanced") * 20} seconds'
                    else:
                        notes = '💪 Focus on form and control'
                    
                    exercises.append({
                        'name': exercise,
                        'sets': sets,
                        'reps': reps,
                        'rest_seconds': 90 if sets >= 4 else 60,
                        'category': category,
                        'notes': notes
                    })
                    added_from_category += 1
                    exercises_added += 1
            
            # If no weakness exercises added, add from primary
            if added_from_category == 0 and primary:
                for exercise in primary[:category_limit]:
                    if exercises_added >= max_exercises:
                        break
                        
                    sets = base_sets
                    reps = base_reps
                    
                    # Adjust based on exercise type
                    if exercise.lower() in ['squats', 'deadlifts', 'bench press']:
                        reps = max(int(base_reps * 0.75), 6)
                        sets = min(base_sets + 1, 5)
                        notes = '🏋️ Compound movement - control the weight'
                    elif exercise.lower() in ['push-ups', 'pull-ups']:
                        notes = '✅ Full range of motion, squeeze at the top'
                    elif exercise.lower() == 'plank':
                        reps = 1
                        sets = 3
                        notes = f'⏱️ Hold for {30 + (fitness_level == "advanced") * 20} seconds'
                    elif 'curl' in exercise.lower() or 'extension' in exercise.lower():
                        reps = base_reps + 2
                        notes = '🎯 Isolation - squeeze at peak contraction'
                    else:
                        notes = '💪 Maintain proper form'
                    
                    exercises.append({
                        'name': exercise,
                        'sets': sets,
                        'reps': reps,
                        'rest_seconds': 90 if sets >= 4 else 60,
                        'category': category,
                        'notes': notes
                    })
                    added_from_category += 1
                    exercises_added += 1
        
        return exercises
    
    @classmethod
    def _generate_workout_notes(cls, workout_type: str, fitness_level: str) -> str:
        """Generate helpful notes for the workout day"""
        notes = {
            'full': 'Full body workout - rest 48 hours before next full body session',
            'upper': 'Upper body focus - engage core throughout all movements',
            'lower': 'Lower body focus - maintain proper hip hinge and knee alignment',
            'push': 'Pushing movements - keep shoulders back and down',
            'pull': 'Pulling movements - squeeze shoulder blades together',
            'legs': 'Leg day - focus on depth and stability'
        }
        
        base_note = notes.get(workout_type, 'Complete all exercises with proper form')
        
        if fitness_level == 'beginner':
            return f'{base_note}. Take your time and prioritize technique over speed.'
        elif fitness_level == 'intermediate':
            return f'{base_note}. Challenge yourself while maintaining good form.'
        else:
            return f'{base_note}. Push your limits with perfect technique.'
    
    @classmethod
    def _generate_meal_plan(cls, profile: Dict) -> Dict:
        """Generate personalized 7-day meal plan based on TDEE and goals"""
        tdee = profile['tdee']
        fitness_goal = profile['fitness_goal']
        latest_workout = profile['latest_workout']
        exercise_category = latest_workout.get('exercise_category', 'Full Body')
        
        print(f"[MealPlan] 🍽️ Generating meal plan for exercise_category: {exercise_category}")
        print(f"[MealPlan] Latest workout data: {latest_workout}")
        
        # Use exercise category to create variety in meal selection
        # Each category gets a different starting point for meal rotation
        category_offset = {
            'Push': 0,
            'Pull': 1,
            'Legs': 2,
            'Core': 3,
            'Full Body': 4
        }.get(exercise_category, 0)
        
        print(f"[MealPlan] Category offset: {category_offset} (Push=0, Pull=1, Legs=2, Core=3)")
        
        # Adjust calories based on fitness goal
        if fitness_goal == 'weight_loss':
            daily_calories = int(tdee * 0.85)  # 15% deficit
            protein_ratio = 0.30  # 30% protein
            carb_ratio = 0.35     # 35% carbs
            fat_ratio = 0.35      # 35% fats
        elif fitness_goal == 'muscle_gain':
            daily_calories = int(tdee * 1.15)  # 15% surplus
            protein_ratio = 0.30  # 30% protein
            carb_ratio = 0.45     # 45% carbs
            fat_ratio = 0.25      # 25% fats
        else:  # maintenance
            daily_calories = tdee
            protein_ratio = 0.25  # 25% protein
            carb_ratio = 0.45     # 45% carbs
            fat_ratio = 0.30      # 30% fats
        
        # Calculate macros
        protein_grams = int((daily_calories * protein_ratio) / 4)  # 4 cal/g
        carb_grams = int((daily_calories * carb_ratio) / 4)        # 4 cal/g
        fat_grams = int((daily_calories * fat_ratio) / 9)          # 9 cal/g
        
        # Generate 7-day plan with DIFFERENT meals each day
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        plan_data = []
        
        # Meal distribution (percentage of daily calories)
        meal_distribution = {
            'breakfast': 0.25,  # 25% of daily calories
            'lunch': 0.35,      # 35% of daily calories
            'dinner': 0.30,     # 30% of daily calories
            'snack': 0.10       # 10% of daily calories
        }
        
        for day_idx, day_name in enumerate(days):
            meals = []
            day_total_calories = 0
            day_total_protein = 0
            day_total_carbs = 0
            day_total_fats = 0
            
            # Generate each meal for the day
            for meal_type, meal_ratio in meal_distribution.items():
                target_calories = int(daily_calories * meal_ratio)
                
                # Calculate meal macros (proportional to calories)
                meal_protein = int(protein_grams * meal_ratio)
                meal_carbs = int(carb_grams * meal_ratio)
                meal_fats = int(fat_grams * meal_ratio)
                
                # Get meal details based on type - DIFFERENT FOR EACH DAY AND CATEGORY
                # Add category_offset to ensure different meals for different exercise types
                meal_idx = (day_idx + category_offset) % 7
                
                if meal_type == 'breakfast':
                    meal_name, meal_items = cls._get_breakfast_for_day(meal_idx, target_calories)
                    meal_time = '7:00 AM'
                elif meal_type == 'lunch':
                    meal_name, meal_items = cls._get_lunch_for_day(meal_idx, target_calories)
                    meal_time = '12:30 PM'
                elif meal_type == 'dinner':
                    meal_name, meal_items = cls._get_dinner_for_day(meal_idx, target_calories)
                    meal_time = '6:30 PM'
                else:  # snack
                    meal_name, meal_items = cls._get_snack_for_day(meal_idx, target_calories)
                    meal_time = '3:00 PM'
                
                meal = {
                    'name': meal_name,
                    'meal_type': meal_type.capitalize(),
                    'time': meal_time,
                    'calories': target_calories,
                    'protein': meal_protein,
                    'carbs': meal_carbs,
                    'fats': meal_fats,
                    'items': meal_items,
                    'description': f'{meal_name} - {target_calories} cal, P:{meal_protein}g C:{meal_carbs}g F:{meal_fats}g'
                }
                
                meals.append(meal)
                
                # Track daily totals
                day_total_calories += target_calories
                day_total_protein += meal_protein
                day_total_carbs += meal_carbs
                day_total_fats += meal_fats
            
            day_plan = {
                'day': day_name,
                'meals': meals,
                'total_calories': day_total_calories,
                'total_protein': day_total_protein,
                'total_carbs': day_total_carbs,
                'total_fats': day_total_fats
            }
            
            plan_data.append(day_plan)
        
        return plan_data
    
    @classmethod
    def _get_breakfast_for_day(cls, day_idx: int, target: int) -> Tuple[str, List[str]]:
        """Get DIFFERENT breakfast for each day with ACTUAL FOOD NAMES"""
        # All breakfast options with actual meal names
        breakfast_options = [
            ('Oatmeal with Berries & Protein', [
                '🥣 Steel-cut oatmeal - 1 cup cooked (150 cal)',
                '🥛 Whey protein powder - 1 scoop (120 cal)',
                '🫐 Mixed berries - 1/2 cup (40 cal)',
                '🥜 Walnuts - 1 oz (185 cal)',
                '🍯 Honey - 1 tbsp (64 cal)',
                '☕ Black coffee (0 cal)'
            ]),
            ('Greek Yogurt Parfait', [
                '🥛 Greek yogurt (plain, 2%) - 1.5 cups (195 cal)',
                '🌾 Granola - 1/2 cup (240 cal)',
                '🍓 Strawberries - 1 cup sliced (50 cal)',
                '🍌 Banana - 1 medium (105 cal)',
                '🍯 Honey drizzle - 1 tbsp (64 cal)'
            ]),
            ('Scrambled Eggs & Avocado Toast', [
                '🍳 Scrambled eggs - 3 large (210 cal)',
                '🍞 Whole wheat bread - 2 slices toasted (140 cal)',
                '🥑 Avocado - 1/2 mashed (120 cal)',
                '🍅 Cherry tomatoes - 1 cup (27 cal)',
                '🧀 Feta cheese - 1 oz (75 cal)',
                '🍊 Orange juice - 8 oz (110 cal)'
            ]),
            ('Protein Pancakes with Fruit', [
                '🥞 Protein pancakes - 3 medium (300 cal)',
                '🍓 Strawberries - 1 cup (50 cal)',
                '🍯 Maple syrup - 2 tbsp (104 cal)',
                '🥓 Turkey bacon - 3 strips (105 cal)',
                '🥛 Skim milk - 1 cup (83 cal)'
            ]),
            ('Smoothie Bowl', [
                '🥤 Protein smoothie base - 12 oz (200 cal)',
                '  - Banana, spinach, protein powder, almond milk',
                '🥜 Almond butter - 2 tbsp (190 cal)',
                '🌾 Granola - 1/4 cup (120 cal)',
                '🥥 Coconut flakes - 2 tbsp (33 cal)',
                '🫐 Blueberries - 1/2 cup (42 cal)'
            ]),
            ('Breakfast Burrito', [
                '🌯 Whole wheat tortilla - large (170 cal)',
                '🍳 Scrambled eggs - 2 large (140 cal)',
                '🧀 Cheddar cheese - 1 oz (114 cal)',
                '🥓 Turkey sausage - 2 links (140 cal)',
                '🫑 Bell peppers & onions - 1/2 cup (20 cal)',
                '🥑 Salsa - 1/4 cup (18 cal)'
            ]),
            ('Bagel with Smoked Salmon', [
                '🥯 Whole wheat bagel - 1 (280 cal)',
                '🐟 Smoked salmon - 3 oz (99 cal)',
                '🧀 Cream cheese (light) - 2 tbsp (70 cal)',
                '🥒 Cucumber slices - 1/2 cup (8 cal)',
                '🧅 Red onion - 2 slices (10 cal)',
                '🍋 Lemon wedge (0 cal)',
                '☕ Green tea (0 cal)'
            ])
        ]
        
        # Select meal for this day (cycle through options)
        meal_idx = day_idx % len(breakfast_options)
        return breakfast_options[meal_idx]
    
    @classmethod
    def _get_lunch_for_day(cls, day_idx: int, target: int) -> Tuple[str, List[str]]:
        """Get DIFFERENT lunch for each day with ACTUAL FOOD NAMES"""
        lunch_options = [
            ('Grilled Chicken Salad', [
                '🍗 Grilled chicken breast - 6 oz (280 cal)',
                '🥗 Mixed greens - 3 cups (30 cal)',
                '🥒 Cucumber - 1 cup sliced (16 cal)',
                '🍅 Cherry tomatoes - 1 cup (27 cal)',
                '🧀 Feta cheese - 1 oz (75 cal)',
                '🫒 Olive oil vinaigrette - 2 tbsp (120 cal)',
                '🍞 Whole grain roll - 1 (90 cal)',
                '🍎 Apple - 1 medium (95 cal)'
            ]),
            ('Turkey & Avocado Sandwich', [
                '🥪 Whole wheat bread - 2 slices (140 cal)',
                '🦃 Sliced turkey breast - 5 oz (150 cal)',
                '🥑 Avocado - 1/2 sliced (120 cal)',
                '🧀 Swiss cheese - 1 slice (106 cal)',
                '🥬 Lettuce & tomato (15 cal)',
                '🥒 Pickle spear (5 cal)',
                '🥔 Baked chips - 1 oz (120 cal)',
                '🍊 Orange - 1 medium (62 cal)'
            ]),
            ('Salmon & Quinoa Bowl', [
                '🐟 Grilled salmon - 5 oz (290 cal)',
                '🍚 Quinoa - 1 cup cooked (222 cal)',
                '🥦 Roasted broccoli - 1.5 cups (83 cal)',
                '🥕 Roasted carrots - 1 cup (55 cal)',
                '🥑 Avocado slices - 1/4 (60 cal)',
                '🍋 Lemon juice & herbs (5 cal)',
                '🥜 Sliced almonds - 1/4 cup (135 cal)'
            ]),
            ('Chicken Stir-Fry', [
                '🍗 Chicken breast - 6 oz stir-fried (280 cal)',
                '🍚 Jasmine rice - 1 cup cooked (205 cal)',
                '🥦 Broccoli florets - 1 cup (55 cal)',
                '🫑 Bell peppers - 1 cup sliced (39 cal)',
                '🥕 Carrots - 1/2 cup (27 cal)',
                '🧄 Garlic & ginger (10 cal)',
                '🥢 Low-sodium soy sauce - 2 tbsp (20 cal)',
                '🌰 Cashews - 1 oz (157 cal)'
            ]),
            ('Beef Taco Bowl', [
                '🥩 Lean ground beef - 5 oz (275 cal)',
                '🍚 Brown rice - 1 cup cooked (218 cal)',
                '🫘 Black beans - 1/2 cup (114 cal)',
                '🥬 Shredded lettuce - 1 cup (8 cal)',
                '🍅 Diced tomatoes - 1/2 cup (16 cal)',
                '🧀 Cheddar cheese - 1 oz (114 cal)',
                '🌶️ Salsa - 1/4 cup (18 cal)',
                '🥑 Guacamole - 2 tbsp (45 cal)'
            ]),
            ('Mediterranean Wrap', [
                '🌯 Whole wheat wrap - large (170 cal)',
                '🍗 Grilled chicken - 4 oz (185 cal)',
                '🍅 Sun-dried tomatoes - 1/4 cup (35 cal)',
                '🫒 Kalamata olives - 6 olives (40 cal)',
                '🧀 Feta cheese - 1 oz (75 cal)',
                '🥒 Cucumber - 1/2 cup (8 cal)',
                '🥬 Spinach leaves - 1 cup (7 cal)',
                '🥫 Hummus - 3 tbsp (100 cal)',
                '🍇 Grapes - 1 cup (104 cal)'
            ]),
            ('Shrimp & Pasta', [
                '🦐 Grilled shrimp - 6 oz (180 cal)',
                '🍝 Whole wheat pasta - 2 oz dry (200 cal)',
                '🍅 Cherry tomatoes - 1 cup (27 cal)',
                '🥦 Broccoli - 1 cup (55 cal)',
                '🧄 Garlic & herbs (10 cal)',
                '🫒 Olive oil - 1 tbsp (119 cal)',
                '🧀 Parmesan - 2 tbsp (43 cal)',
                '🍞 Garlic bread - 1 slice (100 cal)'
            ])
        ]
        
        meal_idx = day_idx % len(lunch_options)
        return lunch_options[meal_idx]
    
    @classmethod
    def _get_dinner_for_day(cls, day_idx: int, target: int) -> Tuple[str, List[str]]:
        """Get DIFFERENT dinner for each day with ACTUAL FOOD NAMES"""
        dinner_options = [
            ('Baked Salmon with Sweet Potato', [
                '🐟 Baked salmon fillet - 6 oz (350 cal)',
                '🍠 Baked sweet potato - 1 large (162 cal)',
                '🥦 Steamed broccoli - 2 cups (110 cal)',
                '🥕 Baby carrots - 1 cup (52 cal)',
                '🫒 Olive oil drizzle - 1 tbsp (119 cal)',
                '🧄 Garlic & herbs (5 cal)',
                '🍋 Lemon wedge (0 cal)'
            ]),
            ('Grilled Steak & Vegetables', [
                '🥩 Sirloin steak - 6 oz grilled (336 cal)',
                '🥔 Roasted potatoes - 1 cup (160 cal)',
                '🫑 Grilled bell peppers - 1 cup (39 cal)',
                '🧅 Grilled onions - 1/2 cup (46 cal)',
                '🥬 Caesar salad - 2 cups (150 cal)',
                '🍞 Dinner roll - 1 (85 cal)',
                '🧈 Butter - 1 tsp (34 cal)'
            ]),
            ('Chicken Parmesan with Pasta', [
                '🍗 Breaded chicken breast - 5 oz (300 cal)',
                '🍝 Spaghetti - 2 oz dry (200 cal)',
                '🍅 Marinara sauce - 1/2 cup (70 cal)',
                '🧀 Mozzarella cheese - 2 oz (168 cal)',
                '🧀 Parmesan - 2 tbsp (43 cal)',
                '🥗 Side salad - 2 cups (50 cal)',
                '🥖 Garlic bread - 1 slice (100 cal)'
            ]),
            ('Baked Tilapia with Rice', [
                '🐟 Baked tilapia - 7 oz (244 cal)',
                '🍚 Brown rice - 1.5 cups cooked (327 cal)',
                '🥦 Steamed broccoli - 1.5 cups (83 cal)',
                '🫑 Roasted red peppers - 1 cup (39 cal)',
                '🌽 Corn on the cob - 1 ear (90 cal)',
                '🧈 Butter - 1 tsp (34 cal)',
                '🍋 Lemon & herbs (5 cal)'
            ]),
            ('Turkey Meatballs with Zucchini Noodles', [
                '🦃 Turkey meatballs - 6 meatballs (300 cal)',
                '🥒 Zucchini noodles - 2 cups (40 cal)',
                '🍅 Marinara sauce - 1 cup (140 cal)',
                '🧀 Parmesan cheese - 3 tbsp (65 cal)',
                '🍞 Garlic bread - 1 slice (100 cal)',
                '🥗 Garden salad - 2 cups (50 cal)',
                '🫒 Balsamic dressing - 2 tbsp (100 cal)'
            ]),
            ('Pork Chops with Vegetables', [
                '🥩 Grilled pork chops - 2 chops (290 cal)',
                '🍠 Mashed sweet potato - 1 cup (249 cal)',
                '🥦 Steamed Brussels sprouts - 1.5 cups (84 cal)',
                '🥕 Glazed carrots - 1 cup (82 cal)',
                '🧄 Garlic & herbs (10 cal)',
                '🍞 Whole grain roll - 1 (90 cal)',
                '🧈 Butter - 1 tsp (34 cal)'
            ]),
            ('Shrimp Tacos', [
                '🦐 Grilled shrimp - 8 oz (240 cal)',
                '🌮 Corn tortillas - 3 small (180 cal)',
                '🥬 Shredded cabbage - 1 cup (22 cal)',
                '🥑 Avocado - 1/2 sliced (120 cal)',
                '🍅 Pico de gallo - 1/2 cup (20 cal)',
                '🧀 Cotija cheese - 2 tbsp (45 cal)',
                '🌶️ Chipotle sauce - 2 tbsp (40 cal)',
                '🌽 Mexican rice - 1 cup (170 cal)'
            ])
        ]
        
        meal_idx = day_idx % len(dinner_options)
        return dinner_options[meal_idx]
    
    @classmethod
    def _get_snack_for_day(cls, day_idx: int, target: int) -> Tuple[str, List[str]]:
        """Get DIFFERENT snack for each day with ACTUAL FOOD NAMES"""
        snack_options = [
            ('Protein Shake with Banana', [
                '🥤 Whey protein shake - 1 scoop (120 cal)',
                '🍌 Banana - 1 medium (105 cal)',
                '🥛 Almond milk - 1 cup (30 cal)'
            ]),
            ('Apple with Peanut Butter', [
                '🍎 Apple - 1 large sliced (116 cal)',
                '🥜 Natural peanut butter - 2 tbsp (188 cal)'
            ]),
            ('Greek Yogurt with Honey', [
                '🥛 Greek yogurt - 1 cup (130 cal)',
                '🍯 Honey - 1 tbsp (64 cal)',
                '🥜 Almonds - 10 nuts (69 cal)'
            ]),
            ('Protein Bar & Fruit', [
                '🍫 Quest protein bar - 1 bar (200 cal)',
                '🍊 Orange - 1 medium (62 cal)'
            ]),
            ('Trail Mix', [
                '🥜 Mixed nuts - 1 oz (170 cal)',
                '🍫 Dark chocolate chips - 1 tbsp (70 cal)',
                '🍇 Raisins - 2 tbsp (60 cal)'
            ]),
            ('Cottage Cheese with Berries', [
                '🧀 Cottage cheese (low-fat) - 1 cup (163 cal)',
                '🫐 Blueberries - 1/2 cup (42 cal)',
                '🌾 Granola - 2 tbsp (60 cal)'
            ]),
            ('Hummus with Veggies', [
                '🥫 Hummus - 1/2 cup (200 cal)',
                '🥕 Baby carrots - 1 cup (52 cal)',
                '🥒 Cucumber slices - 1 cup (16 cal)',
                '🍞 Whole wheat pita - 1/2 (80 cal)'
            ])
        ]
        
        meal_idx = day_idx % len(snack_options)
        return snack_options[meal_idx]
