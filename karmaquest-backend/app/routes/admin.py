"""
Admin routes for system management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.decorators import admin_required
from app.models.user import User, UserProfile
from app.models.workout import WorkoutSession
from app import db

bp = Blueprint('admin', __name__)


@bp.route('/trainers', methods=['POST'])
@jwt_required()
@admin_required()
def create_trainer():
    """Create a new trainer account"""
    try:
        data = request.get_json()
        admin_id = get_jwt_identity()
        
        print(f"[Admin] Creating trainer account: {data.get('email')}")
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False, 
                'error': 'Email already exists'
            }), 400
        
        # Create trainer user
        trainer = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='trainer',
            created_by=admin_id,
            trainer_specialization=data.get('specialization', 'General Fitness')
        )
        trainer.set_password(data['password'])
        
        db.session.add(trainer)
        db.session.flush()
        
        # Create trainer profile
        profile = UserProfile(user_id=trainer.user_id)
        db.session.add(profile)
        
        db.session.commit()
        
        print(f"[Admin] ✅ Trainer created: {trainer.user_id}")
        return jsonify({
            'success': True, 
            'data': trainer.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[Admin] ❌ Error creating trainer: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required()
def list_users():
    """List all users with optional role filter"""
    try:
        role_filter = request.args.get('role')  # 'user', 'trainer', 'admin'
        search = request.args.get('search', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = User.query
        
        # Apply role filter
        if role_filter:
            query = query.filter_by(role=role_filter)
        
        # Apply search filter
        if search:
            query = query.filter(
                db.or_(
                    User.email.ilike(f'%{search}%'),
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%')
                )
            )
        
        # Paginate results
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'users': [u.to_dict() for u in pagination.items],
                'total': pagination.total,
                'pages': pagination.pages,
                'current_page': page
            }
        })
        
    except Exception as e:
        print(f"[Admin] ❌ Error listing users: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
@admin_required()
def get_user(user_id):
    """Get detailed information about a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get workout stats
        workout_count = WorkoutSession.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'profile': user.profile.to_dict() if user.profile else None,
                'stats': {
                    'total_workouts': workout_count
                }
            }
        })
        
    except Exception as e:
        print(f"[Admin] ❌ Error getting user: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
@admin_required()
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Check if email is being changed and validate uniqueness
        if 'email' in data and data['email'] != user.email:
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user:
                return jsonify({
                    'success': False, 
                    'error': 'Email already exists'
                }), 400
        
        # Update allowed fields
        allowed_fields = ['first_name', 'last_name', 'email', 'is_active', 'role', 'trainer_specialization', 'assigned_users']
        for key, value in data.items():
            if key in allowed_fields and hasattr(user, key):
                setattr(user, key, value)
        
        db.session.commit()
        
        print(f"[Admin] ✅ User updated: {user_id}")
        return jsonify({'success': True, 'data': user.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        print(f"[Admin] ❌ Error updating user: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_user(user_id):
    """Delete a user account"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Prevent deleting admin accounts
        if user.role == 'admin':
            return jsonify({
                'success': False, 
                'error': 'Cannot delete admin accounts'
            }), 403
        
        email = user.email
        db.session.delete(user)
        db.session.commit()
        
        print(f"[Admin] ✅ User deleted: {email}")
        return jsonify({
            'success': True, 
            'message': f'User {email} deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"[Admin] ❌ Error deleting user: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required()
def get_system_stats():
    """Get system statistics"""
    try:
        total_users = User.query.filter_by(role='user').count()
        total_trainers = User.query.filter_by(role='trainer').count()
        total_workouts = WorkoutSession.query.count()
        active_users = User.query.filter_by(role='user', is_active=True).count()
        
        # Recent users (last 7 days)
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_users = User.query.filter(
            User.created_at >= week_ago,
            User.role == 'user'
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'total_users': total_users,
                'total_trainers': total_trainers,
                'total_workouts': total_workouts,
                'active_users': active_users,
                'new_users_this_week': recent_users
            }
        })
        
    except Exception as e:
        print(f"[Admin] ❌ Error getting stats: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/trainers/<trainer_id>/assign', methods=['POST'])
@jwt_required()
@admin_required()
def assign_users_to_trainer(trainer_id):
    """Assign users to a trainer"""
    try:
        trainer = User.query.get(trainer_id)
        if not trainer or trainer.role != 'trainer':
            return jsonify({'success': False, 'error': 'Trainer not found'}), 404
        
        data = request.get_json()
        user_ids = data.get('user_ids', [])
        
        # Update trainer's assigned users
        trainer.assigned_users = user_ids
        db.session.commit()
        
        print(f"[Admin] ✅ Assigned {len(user_ids)} users to trainer {trainer_id}")
        return jsonify({
            'success': True,
            'message': f'Assigned {len(user_ids)} users to trainer',
            'data': trainer.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"[Admin] ❌ Error assigning users: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
