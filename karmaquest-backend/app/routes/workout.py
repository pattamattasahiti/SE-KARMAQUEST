from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.workout import WorkoutSession, ExerciseLog
from datetime import datetime

bp = Blueprint('workout', __name__)

@bp.route('/sessions/start', methods=['POST'])
@jwt_required()
def start_session():
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession(user_id=user_id)
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'session': session.to_dict()}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/<session_id>/update', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        data = request.get_json()
        
        if 'duration_seconds' in data:
            session.duration_seconds = data['duration_seconds']
        if 'session_notes' in data:
            session.session_notes = data['session_notes']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'session': session.to_dict()}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/<session_id>/complete', methods=['POST'])
@jwt_required()
def complete_session(session_id):
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        data = request.get_json() or {}
        
        session.duration_seconds = data.get('duration_seconds', session.duration_seconds)
        session.total_exercises = len(session.exercises) if session.exercises else data.get('total_exercises', 0)
        session.total_reps = sum(ex.total_reps for ex in session.exercises) if session.exercises else data.get('total_reps', 0)
        
        # Use provided total_calories if available, otherwise calculate from exercises
        if 'total_calories' in data:
            session.total_calories = data['total_calories']
        elif session.exercises:
            session.total_calories = sum(ex.calories_burned for ex in session.exercises)
        
        if session.exercises:
            session.avg_posture_score = sum(ex.avg_form_score for ex in session.exercises) / len(session.exercises)
        elif 'avg_posture_score' in data:
            session.avg_posture_score = data['avg_posture_score']
        
        if 'session_notes' in data:
            session.session_notes = data['session_notes']
        
        # Store video URL and workout type if provided (for AI workouts)
        if 'video_url' in data:
            session.video_url = data['video_url']
        if 'workout_type' in data:
            session.workout_type = data['workout_type']
        
        db.session.commit()
        
        # ===== GENERATE DYNAMIC PLANS BASED ON WORKOUT PERFORMANCE =====
        print(f"[Workout] Generating dynamic plans for user {user_id} after workout completion...")
        
        try:
            from app.services.dynamic_plan_generator import DynamicPlanGenerator
            from app.models.plan import WeeklyWorkoutPlan, WeeklyMealPlan
            from datetime import datetime, timedelta
            
            # Prepare workout data for plan generation
            workout_data = {
                'total_reps': session.total_reps or 0,
                'sets': 0,  # Will be calculated from exercises
                'form_score': session.avg_posture_score or 70,
                'duration_seconds': session.duration_seconds or 0,
                'calories_burned': session.total_calories or 0,
                'exercise_type': 'mixed',  # Default
                'exercise_category': 'Full Body'  # Default
            }
            
            # Option 1: Get exercise from the request data (for AI workouts where exercise is sent directly)
            if 'exercise_type' in data and data['exercise_type']:
                workout_data['exercise_type'] = data['exercise_type']
                print(f"[Workout] 🎯 Exercise from request data: '{data['exercise_type']}'")
            
            # Option 2: Get primary exercise from exercise logs (if already logged)
            elif session.exercises and len(session.exercises) > 0:
                primary_exercise = session.exercises[0]
                workout_data['exercise_type'] = primary_exercise.exercise_type
                workout_data['sets'] = primary_exercise.sets or 1
                
                print(f"[Workout] 📋 Found {len(session.exercises)} exercises in session")
                print(f"[Workout] 📋 Primary exercise from logs: '{primary_exercise.exercise_type}'")
            
            # Map exercise to category if we have a valid exercise type
            if workout_data['exercise_type'] != 'mixed':
                
                # Map exercise to category - MORE COMPREHENSIVE MAPPING
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
                
                # Map the exercise type to category
                exercise_type_normalized = workout_data['exercise_type'].lower().replace(' ', '_')
                workout_data['exercise_category'] = exercise_category_map.get(
                    exercise_type_normalized, 'Full Body'
                )
                
                print(f"[Workout] 🎯 Exercise type: {workout_data['exercise_type']}")
                print(f"[Workout] 🎯 Normalized: {exercise_type_normalized}")
                print(f"[Workout] 🎯 Detected category: {workout_data['exercise_category']}")
            
            print(f"[Workout] Final workout data: {workout_data}")
            
            # Generate dynamic plans
            workout_plan_data, meal_plan_data = DynamicPlanGenerator.generate_dynamic_plans(
                user_id, workout_data
            )
            
            print(f"[Workout] Plans generated successfully")
            
            # Save workout plan
            start_date = datetime.utcnow().date()
            end_date = start_date + timedelta(days=6)
            
            # Deactivate old workout plans
            WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            
            # Create new workout plan
            workout_plan = WeeklyWorkoutPlan(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                plan_data=workout_plan_data,
                is_active=True
            )
            db.session.add(workout_plan)
            
            # Deactivate old meal plans
            WeeklyMealPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
            
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
            
            print(f"[Workout] ✅ Dynamic plans saved successfully")
            
        except Exception as plan_error:
            print(f"[Workout] ⚠️ Error generating dynamic plans: {str(plan_error)}")
            import traceback
            print(f"[Workout] Traceback: {traceback.format_exc()}")
            # Don't fail the workout completion if plan generation fails
            pass
        
        return jsonify({
            'success': True,
            'data': {'session': session.to_dict()},
            'message': 'Workout completed! New personalized plans generated.'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {'session': session.to_dict()}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .order_by(WorkoutSession.session_date.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'sessions': [s.to_dict() for s in sessions]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Session deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/sessions/<session_id>/exercises', methods=['POST'])
@jwt_required()
def log_exercise(session_id):
    try:
        user_id = get_jwt_identity()
        session = WorkoutSession.query.filter_by(session_id=session_id, user_id=user_id).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        data = request.get_json()
        
        print(f"[Exercise] 📝 Logging exercise for session {session_id}")
        print(f"[Exercise] 📝 Exercise type from frontend: {data.get('exercise_type')}")
        
        exercise = ExerciseLog(
            session_id=session_id,
            exercise_type=data['exercise_type'],
            sets=data.get('sets', 1),
            correct_reps=data.get('correct_reps', 0),
            incorrect_reps=data.get('incorrect_reps', 0),
            total_reps=data.get('total_reps', 0),
            avg_form_score=data.get('avg_form_score', 0),
            duration_seconds=data.get('duration_seconds', 0),
            calories_burned=data.get('calories_burned', 0),
            posture_issues=data.get('posture_issues', [])
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'exercise': exercise.to_dict()}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/exercises/types', methods=['GET'])
@jwt_required()
def get_exercise_types():
    return jsonify({
        'success': True,
        'data': {
            'types': ['squat', 'pushup', 'lunge', 'plank', 'deadlift']
        }
    }), 200

@bp.route('/exercises/history/<exercise_type>', methods=['GET'])
@jwt_required()
def get_exercise_history(exercise_type):
    try:
        user_id = get_jwt_identity()
        
        exercises = db.session.query(ExerciseLog)\
            .join(WorkoutSession)\
            .filter(WorkoutSession.user_id == user_id)\
            .filter(ExerciseLog.exercise_type == exercise_type)\
            .order_by(WorkoutSession.session_date.desc())\
            .limit(50)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'exercises': [ex.to_dict() for ex in exercises]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
