"""
Trainer routes for client management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.decorators import trainer_required
from app.models.user import User
from app.models.workout import WorkoutSession, ExerciseLog
from app.models.plan import WeeklyWorkoutPlan, WeeklyMealPlan
from app import db
from datetime import datetime, timedelta

bp = Blueprint('trainer', __name__)


@bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
@trainer_required()
def get_dashboard_stats():
    """Get aggregated dashboard statistics for trainer"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        if not trainer:
            return jsonify({'success': False, 'error': 'Trainer not found'}), 404
        
        assigned_user_ids = trainer.assigned_users or []
        
        # Initialize stats
        stats = {
            'total_clients': len(assigned_user_ids),
            'active_clients': 0,
            'total_workouts_this_week': 0,
            'avg_performance_score': 0.0
        }
        
        if not assigned_user_ids:
            return jsonify({'success': True, 'data': stats})
        
        # Calculate active clients (clients with at least one workout)
        active_clients_count = db.session.query(WorkoutSession.user_id)\
            .filter(WorkoutSession.user_id.in_(assigned_user_ids))\
            .distinct()\
            .count()
        stats['active_clients'] = active_clients_count
        
        # Calculate start of current week (Monday)
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        start_of_week_datetime = datetime.combine(start_of_week, datetime.min.time())
        
        # Count workouts this week
        workouts_this_week = WorkoutSession.query\
            .filter(WorkoutSession.user_id.in_(assigned_user_ids))\
            .filter(WorkoutSession.session_date >= start_of_week_datetime)\
            .count()
        stats['total_workouts_this_week'] = workouts_this_week
        
        # Calculate average performance score from recent workouts (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_sessions = WorkoutSession.query\
            .filter(WorkoutSession.user_id.in_(assigned_user_ids))\
            .filter(WorkoutSession.session_date >= thirty_days_ago)\
            .filter(WorkoutSession.avg_posture_score.isnot(None))\
            .all()
        
        if recent_sessions:
            total_score = sum(s.avg_posture_score for s in recent_sessions)
            stats['avg_performance_score'] = round(total_score / len(recent_sessions), 1)
        
        print(f"[Trainer] ✅ Dashboard stats calculated for trainer {trainer_id}: {stats}")
        return jsonify({'success': True, 'data': stats})
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting dashboard stats: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients', methods=['GET'])
@jwt_required()
@trainer_required()
def get_assigned_clients():
    """Get list of clients assigned to this trainer"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        if not trainer:
            return jsonify({'success': False, 'error': 'Trainer not found'}), 404
        
        assigned_user_ids = trainer.assigned_users or []
        
        if not assigned_user_ids:
            return jsonify({
                'success': True,
                'data': {'clients': []}
            })
        
        # Get client details with workout stats
        clients = User.query.filter(User.user_id.in_(assigned_user_ids)).all()
        
        client_data = []
        for client in clients:
            # Get recent workout count
            workout_count = WorkoutSession.query.filter_by(user_id=client.user_id).count()
            
            # Get last workout date
            last_session = WorkoutSession.query.filter_by(user_id=client.user_id)\
                .order_by(WorkoutSession.session_date.desc()).first()
            
            client_info = client.to_dict()
            # Add workout stats at top level for frontend compatibility
            client_info['total_workouts'] = workout_count
            client_info['last_workout_date'] = last_session.session_date.isoformat() if last_session else None
            client_data.append(client_info)
        
        return jsonify({
            'success': True,
            'data': {'clients': client_data}
        })
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting clients: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/performance', methods=['GET'])
@jwt_required()
@trainer_required()
def get_client_performance(user_id):
    """Get detailed performance data for a client"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        # Get client details
        client = User.query.get(user_id)
        if not client:
            return jsonify({'success': False, 'error': 'Client not found'}), 404
        
        # Get days parameter (default 30)
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get workout history
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .filter(WorkoutSession.session_date >= start_date)\
            .order_by(WorkoutSession.session_date.desc())\
            .all()
        
        # Calculate statistics
        total_workouts = len(sessions)
        total_duration = sum((s.duration_seconds or 0) / 60 for s in sessions)  # Convert to minutes
        avg_duration = total_duration / total_workouts if total_workouts > 0 else 0
        total_calories = sum(s.total_calories or 0 for s in sessions)
        
        # Calculate average form score
        form_scores = [s.avg_posture_score for s in sessions if s.avg_posture_score is not None]
        avg_form_score = sum(form_scores) / len(form_scores) if form_scores else 0
        
        # Build workout history with exercise counts
        workout_history = []
        for session in sessions:
            exercise_count = len(session.exercises) if session.exercises else session.total_exercises or 0
            workout_history.append({
                'session_id': session.session_id,
                'date': session.session_date.isoformat(),
                'exercises_count': exercise_count,
                'duration': round((session.duration_seconds or 0) / 60),  # Convert seconds to minutes
                'calories_burned': round(session.total_calories or 0),
                'form_score': session.avg_posture_score
            })
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': client.user_id,
                'first_name': client.first_name,
                'last_name': client.last_name,
                'email': client.email,
                'workout_history': workout_history,
                'total_workouts': total_workouts,
                'avg_duration': round(avg_duration, 1),
                'total_calories': round(total_calories, 0),
                'avg_form_score': round(avg_form_score, 1)
            }
        })
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting client performance: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/sessions/<session_id>', methods=['GET'])
@jwt_required()
@trainer_required()
def get_client_workout_session(user_id, session_id):
    """Get detailed workout session for a client including video and exercise logs"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        # Get workout session
        session = WorkoutSession.query.filter_by(
            session_id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        
        # Get exercise logs for this session
        exercise_logs = ExerciseLog.query.filter_by(session_id=session_id).all()
        
        # Build response with session details and exercises
        session_data = {
            'session_id': session.session_id,
            'user_id': session.user_id,
            'date': session.session_date.isoformat(),
            'duration': round((session.duration_seconds or 0) / 60),  # Convert to minutes
            'calories_burned': round(session.total_calories or 0),
            'video_url': session.video_url,
            'avg_form_score': session.avg_posture_score,
            'exercise_logs': []
        }
        
        # Add exercise details
        for log in exercise_logs:
            session_data['exercise_logs'].append({
                'exercise_log_id': log.log_id,  # Use log_id from model
                'exercise_name': log.exercise_type,
                'sets_completed': log.sets or 0,
                'reps_completed': log.total_reps or 0,
                'weight_used': None,  # Not in current model
                'duration': log.duration_seconds,
                'form_score': log.avg_form_score,
                'feedback': log.posture_issues  # Using posture_issues as feedback
            })
        
        return jsonify({
            'success': True,
            'data': session_data
        })
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting workout session: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/feedback', methods=['POST'])
@jwt_required()
@trainer_required()
def add_client_feedback(user_id):
    """Add feedback/notes for a client"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        data = request.get_json()
        feedback = data.get('feedback', '')
        session_id = data.get('session_id')
        
        if not feedback:
            return jsonify({
                'success': False,
                'error': 'Feedback is required'
            }), 400
        
        # Add feedback to specific workout session or most recent
        if session_id:
            session = WorkoutSession.query.filter_by(
                session_id=session_id,
                user_id=user_id
            ).first()
        else:
            session = WorkoutSession.query.filter_by(user_id=user_id)\
                .order_by(WorkoutSession.session_date.desc())\
                .first()
        
        if session:
            trainer_name = f"{trainer.first_name} {trainer.last_name}"
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M')
            feedback_note = f"[Trainer Feedback from {trainer_name} at {timestamp}]\n{feedback}\n"
            
            # Append feedback to existing notes
            if session.session_notes:
                session.session_notes = session.session_notes + "\n\n" + feedback_note
            else:
                session.session_notes = feedback_note
            
            db.session.commit()
            
            print(f"[Trainer] ✅ Feedback added for client {user_id}, session {session.session_id}")
            return jsonify({
                'success': True,
                'message': 'Feedback added successfully',
                'data': {
                    'session_id': session.session_id,
                    'feedback': feedback_note
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Workout session not found'
            }), 404
        
    except Exception as e:
        db.session.rollback()
        print(f"[Trainer] ❌ Error adding feedback: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/workout-plan', methods=['GET'])
@jwt_required()
@trainer_required()
def get_client_workout_plan(user_id):
    """Get client's current workout plan"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        plan = WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not plan:
            # Return empty plan structure instead of error
            return jsonify({
                'success': True,
                'data': {
                    'plan': {
                        'plan_id': None,
                        'user_id': user_id,
                        'plan_name': 'No Active Plan',
                        'description': 'This client does not have an active workout plan yet.',
                        'difficulty': 'beginner',
                        'duration': 0,
                        'plan_data': None,
                        'is_active': False
                    }
                }
            })
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        })
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting workout plan: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/workout-plan', methods=['PUT'])
@jwt_required()
@trainer_required()
def adjust_client_workout_plan(user_id):
    """Adjust client's workout plan"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        data = request.get_json()
        plan_data = data.get('plan_data')
        
        if not plan_data:
            return jsonify({
                'success': False,
                'error': 'Plan data is required'
            }), 400
        
        plan = WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not plan:
            return jsonify({
                'success': False,
                'error': 'No active workout plan found'
            }), 404
        
        plan.plan_data = plan_data
        db.session.commit()
        
        print(f"[Trainer] ✅ Workout plan adjusted for client {user_id}")
        return jsonify({
            'success': True,
            'message': 'Workout plan updated successfully',
            'data': {'plan': plan.to_dict()}
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"[Trainer] ❌ Error adjusting workout plan: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/clients/<user_id>/meal-plan', methods=['GET'])
@jwt_required()
@trainer_required()
def get_client_meal_plan(user_id):
    """Get client's current meal plan"""
    try:
        trainer_id = get_jwt_identity()
        trainer = User.query.get(trainer_id)
        
        # Verify this client is assigned to this trainer
        if user_id not in (trainer.assigned_users or []):
            return jsonify({
                'success': False,
                'error': 'Client not assigned to you'
            }), 403
        
        plan = WeeklyMealPlan.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not plan:
            return jsonify({
                'success': False,
                'error': 'No active meal plan found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        })
        
    except Exception as e:
        print(f"[Trainer] ❌ Error getting meal plan: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
