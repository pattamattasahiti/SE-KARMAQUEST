from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.progress import UserProgress
from app.models.workout import WorkoutSession
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func

bp = Blueprint('progress', __name__)

@bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    try:
        user_id = get_jwt_identity()
        
        # Get total workouts
        total_workouts = WorkoutSession.query.filter_by(user_id=user_id).count()
        
        # Get total calories
        total_calories = db.session.query(func.sum(WorkoutSession.total_calories))\
            .filter_by(user_id=user_id).scalar() or 0
        
        # Get average posture score
        avg_score = db.session.query(func.avg(WorkoutSession.avg_posture_score))\
            .filter_by(user_id=user_id).scalar() or 0
        
        # Get total reps
        total_reps = db.session.query(func.sum(WorkoutSession.total_reps))\
            .filter_by(user_id=user_id).scalar() or 0
        
        # Calculate current streak
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .order_by(WorkoutSession.session_date.desc()).all()
        
        current_streak = 0
        if sessions:
            last_date = sessions[0].session_date.date()
            if (datetime.utcnow().date() - last_date).days <= 1:
                current_streak = 1
                for i in range(1, len(sessions)):
                    diff = (sessions[i-1].session_date.date() - sessions[i].session_date.date()).days
                    if diff <= 1:
                        if diff == 1:
                            current_streak += 1
                    else:
                        break
        
        # Get weight change
        user = User.query.get(user_id)
        weight_change = None
        if user and user.profile:
            progress_entries = UserProgress.query.filter_by(user_id=user_id)\
                .order_by(UserProgress.date).all()
            if progress_entries and len(progress_entries) >= 2:
                weight_change = progress_entries[-1].weight - progress_entries[0].weight
        
        return jsonify({
            'success': True,
            'data': {
                'total_workouts': total_workouts,
                'total_calories': float(total_calories),
                'avg_posture_score': float(avg_score),
                'total_reps': int(total_reps),
                'current_streak': current_streak,
                'weight_change': weight_change
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly():
    try:
        user_id = get_jwt_identity()
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .filter(WorkoutSession.session_date >= week_ago)\
            .order_by(WorkoutSession.session_date)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'sessions': [s.to_dict() for s in sessions]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly():
    try:
        user_id = get_jwt_identity()
        month_ago = datetime.utcnow() - timedelta(days=30)
        
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
            .filter(WorkoutSession.session_date >= month_ago)\
            .order_by(WorkoutSession.session_date)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'sessions': [s.to_dict() for s in sessions]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/weight', methods=['POST'])
@jwt_required()
def log_weight():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        progress = UserProgress(
            user_id=user_id,
            weight=data['weight'],
            date=data.get('date', datetime.utcnow().date())
        )
        
        db.session.add(progress)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'progress': progress.to_dict()}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/weight/history', methods=['GET'])
@jwt_required()
def get_weight_history():
    try:
        user_id = get_jwt_identity()
        
        progress = UserProgress.query.filter_by(user_id=user_id)\
            .filter(UserProgress.weight.isnot(None))\
            .order_by(UserProgress.date.desc())\
            .limit(50)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'progress': [p.to_dict() for p in progress]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/measurements', methods=['POST'])
@jwt_required()
def log_measurements():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        progress = UserProgress(
            user_id=user_id,
            body_measurements=data['measurements'],
            date=data.get('date', datetime.utcnow().date())
        )
        
        db.session.add(progress)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'progress': progress.to_dict()}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    try:
        user_id = get_jwt_identity()
        
        # Calculate achievements
        total_workouts = WorkoutSession.query.filter_by(user_id=user_id).count()
        total_reps = db.session.query(func.sum(WorkoutSession.total_reps))\
            .filter_by(user_id=user_id).scalar() or 0
        
        achievements = []
        
        if total_workouts >= 1:
            achievements.append({'name': 'First Workout', 'icon': '🎯', 'unlocked': True})
        if total_workouts >= 10:
            achievements.append({'name': '10 Workouts', 'icon': '💪', 'unlocked': True})
        if total_workouts >= 50:
            achievements.append({'name': '50 Workouts', 'icon': '🏆', 'unlocked': True})
        if total_reps >= 100:
            achievements.append({'name': '100 Reps', 'icon': '🔥', 'unlocked': True})
        if total_reps >= 1000:
            achievements.append({'name': '1000 Reps', 'icon': '⭐', 'unlocked': True})
        
        return jsonify({
            'success': True,
            'data': {'achievements': achievements}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
