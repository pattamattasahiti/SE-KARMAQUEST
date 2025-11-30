from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User, UserProfile
from datetime import datetime
import os

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()
        
        profile = UserProfile(user_id=user.user_id)
        db.session.add(profile)
        db.session.commit()
        
        access_token = create_access_token(identity=user.user_id)
        refresh_token = create_refresh_token(identity=user.user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict(),
                'profile': profile.to_dict()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data['email']
        password = data['password']
        
        print(f"[Auth] Login attempt for: {email}")
        
        # Query user first
        user = User.query.filter_by(email=email).first()
        
        # If user doesn't exist, check if this is the admin email (create admin on first login)
        if not user:
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@karmaquest.com')
            admin_password = os.getenv('ADMIN_PASSWORD', 'Admin@KarmaQuest2025!')
            
            if email == admin_email and password == admin_password:
                print(f"[Auth] 🔑 Creating admin user on first login")
                user = User(
                    email=email,
                    first_name='Admin',
                    last_name='User',
                    role='admin'
                )
                user.set_password(password)
                db.session.add(user)
                db.session.flush()
                
                # Create admin profile
                admin_profile = UserProfile(user_id=user.user_id)
                db.session.add(admin_profile)
                db.session.commit()
                
                access_token = create_access_token(identity=user.user_id)
                refresh_token = create_refresh_token(identity=user.user_id)
                
                print(f"[Auth] ✅ Admin created and logged in")
                return jsonify({
                    'success': True,
                    'data': {
                        'access_token': access_token,
                        'refresh_token': refresh_token,
                        'user': user.to_dict(),
                        'role': 'admin'
                    }
                }), 200
            else:
                print(f"[Auth] ❌ User not found: {email}")
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # User exists - verify password
        if not user.check_password(password):
            print(f"[Auth] ❌ Invalid password for: {email}")
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=user.user_id)
        refresh_token = create_refresh_token(identity=user.user_id)
        
        print(f"[Auth] ✅ Login successful for {user.role or 'user'}: {email}")
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict(),
                'role': user.role or 'user',
                'profile': user.profile.to_dict() if user.profile else None
            }
        }), 200
    except Exception as e:
        print(f"[Auth] ❌ Login error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@bp.route('/refresh-token', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    refresh_token = create_refresh_token(identity=current_user)
    
    return jsonify({
        'success': True,
        'data': {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    }), 200
