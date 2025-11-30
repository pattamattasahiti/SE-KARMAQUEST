from datetime import datetime, timedelta
import random
from sqlalchemy import func
from app import db
from app.models.workout import WorkoutSession, ExerciseLog

class PlanGeneratorService:
    
    EXERCISES = {
        'beginner': {
            'squat': {'sets': 3, 'reps': 10, 'rest': 60},
            'pushup': {'sets': 3, 'reps': 8, 'rest': 60},
            'plank': {'sets': 3, 'duration': 20, 'rest': 45},
        },
        'intermediate': {
            'squat': {'sets': 4, 'reps': 15, 'rest': 45},
            'pushup': {'sets': 4, 'reps': 12, 'rest': 45},
            'lunge': {'sets': 3, 'reps': 12, 'rest': 60},
            'plank': {'sets': 3, 'duration': 40, 'rest': 45},
        },
        'advanced': {
            'squat': {'sets': 4, 'reps': 20, 'rest': 30},
            'pushup': {'sets': 4, 'reps': 15, 'rest': 30},
            'lunge': {'sets': 4, 'reps': 15, 'rest': 45},
            'deadlift': {'sets': 4, 'reps': 12, 'rest': 60},
            'plank': {'sets': 4, 'duration': 60, 'rest': 30},
        }
    }
    
    MEAL_TEMPLATES = {
        'weight_loss': {
            'calories': 1800,
            'protein': 120,
            'carbs': 150,
            'fats': 60
        },
        'muscle_gain': {
            'calories': 2800,
            'protein': 180,
            'carbs': 350,
            'fats': 80
        },
        'maintenance': {
            'calories': 2200,
            'protein': 140,
            'carbs': 250,
            'fats': 70
        }
    }
    
    SAMPLE_MEALS = {
        'breakfast': [
            {'name': 'Oatmeal with Berries', 'calories': 350, 'protein': 12, 'carbs': 60, 'fats': 8},
            {'name': 'Greek Yogurt Parfait', 'calories': 300, 'protein': 20, 'carbs': 40, 'fats': 5},
            {'name': 'Scrambled Eggs & Toast', 'calories': 400, 'protein': 25, 'carbs': 35, 'fats': 18},
            {'name': 'Protein Smoothie', 'calories': 350, 'protein': 30, 'carbs': 45, 'fats': 8},
        ],
        'lunch': [
            {'name': 'Grilled Chicken Salad', 'calories': 450, 'protein': 40, 'carbs': 30, 'fats': 18},
            {'name': 'Turkey Sandwich', 'calories': 500, 'protein': 35, 'carbs': 55, 'fats': 15},
            {'name': 'Quinoa Buddha Bowl', 'calories': 480, 'protein': 25, 'carbs': 65, 'fats': 12},
            {'name': 'Salmon & Rice', 'calories': 550, 'protein': 45, 'carbs': 50, 'fats': 20},
        ],
        'dinner': [
            {'name': 'Steak & Vegetables', 'calories': 600, 'protein': 50, 'carbs': 40, 'fats': 25},
            {'name': 'Chicken Stir Fry', 'calories': 550, 'protein': 45, 'carbs': 55, 'fats': 18},
            {'name': 'Baked Fish & Sweet Potato', 'calories': 500, 'protein': 40, 'carbs': 50, 'fats': 15},
            {'name': 'Turkey Meatballs & Pasta', 'calories': 580, 'protein': 42, 'carbs': 60, 'fats': 18},
        ],
        'snack': [
            {'name': 'Apple with Peanut Butter', 'calories': 200, 'protein': 8, 'carbs': 25, 'fats': 10},
            {'name': 'Protein Bar', 'calories': 220, 'protein': 20, 'carbs': 25, 'fats': 7},
            {'name': 'Mixed Nuts', 'calories': 180, 'protein': 6, 'carbs': 10, 'fats': 15},
            {'name': 'Greek Yogurt', 'calories': 150, 'protein': 15, 'carbs': 18, 'fats': 3},
        ]
    }
    
    @staticmethod
    def generate_workout_plan(user_profile, start_date=None):
        """Generate a 7-day workout plan based on user profile and workout history"""
        try:
            if not start_date:
                start_date = datetime.utcnow().date()
            
            print(f"[PlanGen] Starting plan generation for date: {start_date}")
            
            # Get user's workout history to personalize plan
            user_id = getattr(user_profile, 'user_id', None)
            recent_sessions = []
            
            if user_id:
                try:
                    print(f"[PlanGen] Fetching workout history for user: {user_id}")
                    recent_sessions = WorkoutSession.query.filter_by(user_id=user_id)\
                        .order_by(WorkoutSession.session_date.desc())\
                        .limit(10)\
                        .all()
                    print(f"[PlanGen] Found {len(recent_sessions)} recent sessions")
                except Exception as e:
                    print(f"[PlanGen] Error fetching workout sessions: {e}")
                    recent_sessions = []
            
            # Analyze workout history
            total_workouts = len(recent_sessions)
            avg_form_score = 0
            frequently_done_exercises = []
            
            if recent_sessions:
                # Calculate average form score
                form_scores = [s.avg_posture_score for s in recent_sessions if s.avg_posture_score]
                if form_scores:
                    avg_form_score = sum(form_scores) / len(form_scores)
                print(f"[PlanGen] Average form score: {avg_form_score}")
                
                # Get frequently done exercises
                try:
                    exercise_logs = ExerciseLog.query.join(WorkoutSession)\
                        .filter(WorkoutSession.user_id == user_id)\
                        .all()
                    
                    exercise_counts = {}
                    for log in exercise_logs:
                        exercise_counts[log.exercise_type] = exercise_counts.get(log.exercise_type, 0) + 1
                    
                    frequently_done_exercises = sorted(exercise_counts.keys(), 
                                                     key=lambda x: exercise_counts[x], 
                                                     reverse=True)[:3]
                    print(f"[PlanGen] Frequently done exercises: {frequently_done_exercises}")
                except Exception as e:
                    print(f"[PlanGen] Error fetching exercise logs: {e}")
            
            # Determine fitness level based on history and profile
            fitness_level = getattr(user_profile, 'fitness_level', None) or 'beginner'
            print(f"[PlanGen] Initial fitness level: {fitness_level}")
            
            # Adjust level based on workout consistency and form
            if total_workouts >= 20 and avg_form_score >= 80:
                fitness_level = 'advanced'
            elif total_workouts >= 10 and avg_form_score >= 70:
                fitness_level = 'intermediate'
            
            exercises = PlanGeneratorService.EXERCISES.get(fitness_level, PlanGeneratorService.EXERCISES['beginner'])
            
            days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            plan_data = {'days': []}
            
            # Create alternating workout days with rest days
            # More workouts for intermediate/advanced users
            workout_patterns = {
                'beginner': ['upper', 'rest', 'lower', 'rest', 'full', 'rest', 'rest'],  # 3 days
                'intermediate': ['upper', 'lower', 'rest', 'upper', 'lower', 'rest', 'cardio'],  # 5 days
                'advanced': ['upper', 'lower', 'cardio', 'upper', 'lower', 'full', 'rest']  # 6 days
            }
            
            pattern = workout_patterns.get(fitness_level, workout_patterns['beginner'])
            
            for i, day_name in enumerate(days):
                day_plan = {
                    'day': i + 1,
                    'day_name': day_name,
                    'date': (start_date + timedelta(days=i)).isoformat(),
                    'exercises': [],
                    'focus': pattern[i].title().replace('_', ' '),
                    'estimated_duration_minutes': 0
                }
                
                if pattern[i] == 'rest':
                    day_plan['exercises'] = []
                    day_plan['estimated_duration_minutes'] = 0
                    day_plan['notes'] = 'Recovery day - stay active with light stretching or walking'
                else:
                    # Add exercises based on focus area
                    if pattern[i] == 'upper':
                        ex_list = ['pushup']
                        if 'pullup' in exercises:
                            ex_list.append('pullup')
                        ex_list.append('plank')
                    elif pattern[i] == 'lower':
                        ex_list = ['squat']
                        if 'lunge' in exercises:
                            ex_list.append('lunge')
                        if 'deadlift' in exercises and fitness_level != 'beginner':
                            ex_list.append('deadlift')
                    elif pattern[i] == 'cardio':
                        day_plan['notes'] = '30 minutes of cardio: jogging, cycling, or swimming'
                        day_plan['estimated_duration_minutes'] = 30
                        plan_data['days'].append(day_plan)
                        continue
                    else:  # full body
                        ex_list = list(exercises.keys())[:3]
                    
                    # Prioritize exercises user has done before
                    if frequently_done_exercises:
                        for freq_ex in frequently_done_exercises:
                            if freq_ex in exercises and freq_ex not in ex_list:
                                ex_list.insert(0, freq_ex)
                                break
                    
                    total_time = 0
                    for ex_type in ex_list[:4]:  # Max 4 exercises per day
                        if ex_type in exercises:
                            ex_data = exercises[ex_type].copy()
                            ex_data['name'] = ex_type.title()
                            
                            # Adjust difficulty based on form score history
                            if avg_form_score >= 85 and fitness_level != 'advanced':
                                # Increase reps/sets if user is doing well
                                if 'reps' in ex_data:
                                    ex_data['reps'] = min(ex_data['reps'] + 2, 20)
                            
                            day_plan['exercises'].append(ex_data)
                            
                            # Estimate time
                            if 'duration' in ex_data:
                                total_time += ex_data['sets'] * (ex_data['duration'] + ex_data['rest'])
                            else:
                                total_time += ex_data['sets'] * (ex_data['reps'] * 3 + ex_data['rest'])
                    
                    day_plan['estimated_duration_minutes'] = max(total_time // 60, 20)
                    
                    # Add motivational notes based on user progress
                    if avg_form_score >= 80:
                        day_plan['notes'] = f'Great form! Keep up the excellent work.'
                    elif avg_form_score >= 60:
                        day_plan['notes'] = f'Focus on form quality over quantity today.'
                    else:
                        day_plan['notes'] = f'Take your time - perfect form is the priority.'
                
                plan_data['days'].append(day_plan)
            
            # Add plan metadata
            plan_data['fitness_level'] = fitness_level
            plan_data['based_on_workouts'] = total_workouts
            plan_data['avg_form_score'] = round(avg_form_score, 1) if avg_form_score else None
            plan_data['personalized'] = total_workouts > 0
            
            print(f"[PlanGen] ✅ Plan generated successfully with {len(plan_data['days'])} days")
            return plan_data
            
        except Exception as e:
            print(f"[PlanGen] ❌ Error in plan generation: {str(e)}")
            import traceback
            print(f"[PlanGen] Traceback: {traceback.format_exc()}")
            # Return a basic fallback plan
            return {
                'days': [],
                'fitness_level': 'beginner',
                'based_on_workouts': 0,
                'avg_form_score': None,
                'personalized': False,
                'error': str(e)
            }
    
    @staticmethod
    def generate_meal_plan(user_profile, start_date=None):
        """Enhanced meal plan generation with BMR calculation and workout-based personalization"""
        if not start_date:
            start_date = datetime.utcnow().date()
        
        # Get user data with safe defaults
        try:
            # Calculate age from date_of_birth
            date_of_birth = getattr(user_profile, 'date_of_birth', None)
            if date_of_birth:
                today = datetime.utcnow().date()
                age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
            else:
                age = 30  # Default age
        except:
            age = 30
        
        weight = getattr(user_profile, 'current_weight', None) or 70  # kg
        height = getattr(user_profile, 'height', None) or 170  # cm
        gender = getattr(user_profile, 'gender', None) or 'male'
        fitness_goal = getattr(user_profile, 'fitness_goal', None) or 'maintenance'
        user_id = getattr(user_profile, 'user_id', None)
        
        print(f"[MealPlan] Generating for: age={age}, weight={weight}kg, height={height}cm, gender={gender}, goal={fitness_goal}")
        
        # Calculate BMR using Mifflin-St Jeor Equation
        if gender.lower() == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        print(f"[MealPlan] BMR calculated: {bmr} calories")
        
        # Determine activity level from recent workout frequency
        activity_multiplier = 1.2  # Sedentary (default)
        activity_level = 'Sedentary'
        
        if user_id:
            try:
                # Count workouts in the last 7 days
                recent_workouts = WorkoutSession.query.filter_by(user_id=user_id)\
                    .filter(WorkoutSession.session_date >= start_date - timedelta(days=7))\
                    .count()
                
                print(f"[MealPlan] Recent workouts (last 7 days): {recent_workouts}")
                
                if recent_workouts >= 6:
                    activity_multiplier = 1.725  # Very Active (6-7 days/week)
                    activity_level = 'Very Active'
                elif recent_workouts >= 4:
                    activity_multiplier = 1.55  # Moderate (4-5 days/week)
                    activity_level = 'Moderate'
                elif recent_workouts >= 2:
                    activity_multiplier = 1.375  # Light (2-3 days/week)
                    activity_level = 'Light'
                else:
                    activity_multiplier = 1.2  # Sedentary (0-1 days/week)
                    activity_level = 'Sedentary'
                
                print(f"[MealPlan] Activity level: {activity_level} (multiplier: {activity_multiplier})")
            except Exception as e:
                print(f"[MealPlan] Error fetching workout frequency: {e}")
        
        # Calculate TDEE (Total Daily Energy Expenditure)
        tdee = bmr * activity_multiplier
        print(f"[MealPlan] TDEE: {tdee} calories")
        
        # Adjust calories and macros based on fitness goal
        if fitness_goal == 'weight_loss':
            daily_calories = int(tdee - 500)  # 500 cal deficit for ~0.5kg/week loss
            protein_ratio = 0.35  # Higher protein to preserve muscle
            carbs_ratio = 0.30    # Lower carbs
            fats_ratio = 0.35     # Moderate fats
            goal_description = "Weight Loss (500 cal deficit)"
        elif fitness_goal == 'muscle_gain':
            daily_calories = int(tdee + 300)  # 300 cal surplus for muscle growth
            protein_ratio = 0.30  # High protein for muscle building
            carbs_ratio = 0.45    # High carbs for energy
            fats_ratio = 0.25     # Moderate fats
            goal_description = "Muscle Gain (300 cal surplus)"
        else:  # maintenance
            daily_calories = int(tdee)
            protein_ratio = 0.25
            carbs_ratio = 0.45
            fats_ratio = 0.30
            goal_description = "Maintenance"
        
        print(f"[MealPlan] Goal: {goal_description}, Daily calories: {daily_calories}")
        
        # Calculate macro targets in grams
        protein_grams = int((daily_calories * protein_ratio) / 4)  # 4 cal/gram
        carbs_grams = int((daily_calories * carbs_ratio) / 4)      # 4 cal/gram
        fats_grams = int((daily_calories * fats_ratio) / 9)        # 9 cal/gram
        
        print(f"[MealPlan] Macros - P: {protein_grams}g, C: {carbs_grams}g, F: {fats_grams}g")
        
        # Generate 7-day plan
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        plan_data = []
        
        # Calculate calories per meal type (proportional distribution)
        meal_distribution = {
            'breakfast': 0.25,  # 25% of daily calories
            'lunch': 0.35,      # 35% of daily calories
            'dinner': 0.30,     # 30% of daily calories
            'snack': 0.10       # 10% of daily calories
        }
        
        for i, day in enumerate(days):
            meals = []
            day_total_calories = 0
            day_total_protein = 0
            day_total_carbs = 0
            day_total_fats = 0
            
            # Generate meals for each type
            for meal_type, meal_ratio in meal_distribution.items():
                target_calories = daily_calories * meal_ratio
                
                # Get available meals for this type
                available_meals = PlanGeneratorService.SAMPLE_MEALS[meal_type]
                
                # Find meal closest to target calories
                selected_meal = min(available_meals, 
                                  key=lambda m: abs(m['calories'] - target_calories))
                meal = selected_meal.copy()
                
                # Scale the meal to better match calorie target
                scale_factor = target_calories / meal['calories']
                meal['calories'] = int(meal['calories'] * scale_factor)
                meal['protein'] = int(meal['protein'] * scale_factor)
                meal['carbs'] = int(meal['carbs'] * scale_factor)
                meal['fats'] = int(meal['fats'] * scale_factor)
                meal['meal_type'] = meal_type
                meal['description'] = f"Healthy {meal_type} option for your {fitness_goal} goal"
                
                meals.append(meal)
                
                # Track daily totals
                day_total_calories += meal['calories']
                day_total_protein += meal['protein']
                day_total_carbs += meal['carbs']
                day_total_fats += meal['fats']
            
            day_plan = {
                'day': day,
                'date': (start_date + timedelta(days=i)).isoformat(),
                'meals': meals,
                'total_calories': day_total_calories,
                'total_protein': day_total_protein,
                'total_carbs': day_total_carbs,
                'total_fats': day_total_fats,
                'target_calories': daily_calories,
                'target_protein': protein_grams,
                'target_carbs': carbs_grams,
                'target_fats': fats_grams
            }
            
            plan_data.append(day_plan)
        
        print(f"[MealPlan] ✅ Generated 7-day plan with {len(plan_data)} days")
        
        # Add metadata to plan
        plan_metadata = {
            'bmr': int(bmr),
            'tdee': int(tdee),
            'activity_level': activity_level,
            'fitness_goal': fitness_goal,
            'goal_description': goal_description,
            'daily_calories': daily_calories,
            'macro_targets': {
                'protein': protein_grams,
                'carbs': carbs_grams,
                'fats': fats_grams
            },
            'personalized': True
        }
        
        # Add metadata to first element or as separate key
        full_plan_data = plan_data
        
        return full_plan_data, daily_calories
