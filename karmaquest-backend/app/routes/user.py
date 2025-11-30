from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserProfile

bp = Blueprint('user', __name__)

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'profile': user.profile.to_dict() if user.profile else None
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        print(f"[Profile Update] User ID: {user_id}")
        
        user = User.query.get(user_id)
        
        if not user:
            print(f"[Profile Update] User not found: {user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get JSON data if available
        data = {}
        if request.is_json:
            data = request.get_json() or {}
        print(f"[Profile Update] Data received: {data}")
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'date_of_birth' in data:
            user.date_of_birth = data['date_of_birth']
        if 'gender' in data:
            user.gender = data['gender']
        if 'profile_picture_url' in data:
            user.profile_picture_url = data['profile_picture_url']
            print(f"[Profile Update] Setting profile picture URL")
        
        # Update or create profile
        if not user.profile:
            print(f"[Profile Update] Creating new profile for user: {user_id}")
            new_profile = UserProfile(user_id=user_id)
            db.session.add(new_profile)
            db.session.flush()  # Flush to get the profile_id
            user.profile = new_profile
        
        profile = user.profile
        print(f"[Profile Update] Profile ID: {profile.profile_id if profile else 'None'}")
        
        if 'current_weight' in data:
            profile.current_weight = float(data['current_weight']) if data['current_weight'] else None
            print(f"[Profile Update] Setting current_weight: {profile.current_weight}")
        if 'height' in data:
            profile.height = float(data['height']) if data['height'] else None
            print(f"[Profile Update] Setting height: {profile.height}")
        if 'target_weight' in data:
            profile.target_weight = float(data['target_weight']) if data['target_weight'] else None
            print(f"[Profile Update] Setting target_weight: {profile.target_weight}")
        if 'fitness_goal' in data:
            profile.fitness_goal = data['fitness_goal']
        if 'fitness_level' in data:
            profile.fitness_level = data['fitness_level']
        if 'medical_conditions' in data:
            profile.medical_conditions = data['medical_conditions']
        if 'preferences' in data:
            profile.preferences = data['preferences']
        
        print(f"[Profile Update] Committing changes...")
        db.session.commit()
        print(f"[Profile Update] ✅ Success")
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'profile': profile.to_dict()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"[Profile Update] ❌ Error: {str(e)}")
        import traceback
        print(f"[Profile Update] Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/profile/goals', methods=['PUT'])
@jwt_required()
def update_goals():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.profile:
            return jsonify({'success': False, 'error': 'Profile not found'}), 404
        
        data = request.get_json()
        profile = user.profile
        
        if 'fitness_goal' in data:
            profile.fitness_goal = data['fitness_goal']
        if 'target_weight' in data:
            profile.target_weight = data['target_weight']
        if 'fitness_level' in data:
            profile.fitness_level = data['fitness_level']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'profile': profile.to_dict()}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/account', methods=['DELETE'])
@jwt_required()
def delete_account():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
