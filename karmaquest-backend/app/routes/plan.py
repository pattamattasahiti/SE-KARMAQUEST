from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.plan import WeeklyWorkoutPlan, WeeklyMealPlan
from app.models.user import User
from app.services.plan_generator import PlanGeneratorService
from app.services.dynamic_plan_generator import DynamicPlanGenerator
from datetime import datetime, timedelta

bp = Blueprint('plan', __name__)

@bp.route('/workout/generate', methods=['POST'])
@jwt_required()
def generate_workout_plan():
    try:
        user_id = get_jwt_identity()
        print(f"[Plan] Generating plan for user: {user_id}")
        
        user = User.query.get(user_id)
        
        if not user:
            print(f"[Plan] User not found: {user_id}")
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        print(f"[Plan] User found: {user.email}")
        
        # Create a default profile object if user.profile doesn't exist
        if not user.profile:
            print(f"[Plan] No profile found, creating default profile")
            # Create a simple profile object with defaults
            from types import SimpleNamespace
            user.profile = SimpleNamespace(
                user_id=user_id,
                fitness_level='beginner',
                fitness_goal='maintenance'
            )
        else:
            print(f"[Plan] Profile found: {user.profile}")
        
        # Get JSON data if available, but don't fail if not
        data = {}
        if request.is_json:
            data = request.get_json() or {}
        
        start_date = datetime.utcnow().date()
        end_date = start_date + timedelta(days=6)
        
        print(f"[Plan] Start date: {start_date}, End date: {end_date}")
        
        # Deactivate old plans
        old_plans_count = WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).count()
        print(f"[Plan] Deactivating {old_plans_count} old plans")
        WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
        
        # Generate personalized plan using DynamicPlanGenerator
        print(f"[Plan] 🎯 Generating DYNAMIC personalized plan based on workout history...")
        
        # Try to generate dynamic plan based on workout history
        result = DynamicPlanGenerator.generate_plans_from_workout(user_id)
        
        if result['success']:
            print(f"[Plan] ✅ Dynamic plans generated successfully!")
            workout_plan_obj = result['workout_plan']
            
            return jsonify({
                'success': True,
                'data': {'plan': workout_plan_obj.to_dict()},
                'message': 'Personalized plan generated based on your workout history!'
            }), 201
        else:
            # Fallback to static plan if no workout history
            print(f"[Plan] ⚠️ No workout history found, generating default plan...")
            plan_data = PlanGeneratorService.generate_workout_plan(user.profile, start_date)
            print(f"[Plan] Default plan data generated: {plan_data is not None}")
            
            # Create new plan
            plan = WeeklyWorkoutPlan(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                plan_data=plan_data,
                is_active=True
            )
            
            print(f"[Plan] Saving default plan to database...")
            db.session.add(plan)
            db.session.commit()
            print(f"[Plan] ✅ Default plan saved successfully")
            
            return jsonify({
                'success': True,
                'data': {'plan': plan.to_dict()},
                'message': 'Complete a workout to get personalized plans!'
            }), 201
    except Exception as e:
        db.session.rollback()
        print(f"[Plan] ❌ Error generating plan: {str(e)}")
        import traceback
        print(f"[Plan] Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/workout/current', methods=['GET'])
@jwt_required()
def get_current_workout_plan():
    try:
        user_id = get_jwt_identity()
        
        plan = WeeklyWorkoutPlan.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not plan:
            return jsonify({'success': False, 'error': 'No active workout plan found'}), 404
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/workout/history', methods=['GET'])
@jwt_required()
def get_workout_plan_history():
    try:
        user_id = get_jwt_identity()
        
        plans = WeeklyWorkoutPlan.query.filter_by(user_id=user_id)\
            .order_by(WeeklyWorkoutPlan.created_at.desc())\
            .limit(10)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'plans': [p.to_dict() for p in plans]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/workout/<plan_id>/regenerate', methods=['PUT'])
@jwt_required()
def regenerate_workout_plan(plan_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.profile:
            return jsonify({'success': False, 'error': 'User profile not found'}), 404
        
        old_plan = WeeklyWorkoutPlan.query.filter_by(plan_id=plan_id, user_id=user_id).first()
        
        if not old_plan:
            return jsonify({'success': False, 'error': 'Plan not found'}), 404
        
        # Generate new plan data
        plan_data = PlanGeneratorService.generate_workout_plan(user.profile, old_plan.start_date)
        
        old_plan.plan_data = plan_data
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'plan': old_plan.to_dict()}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/meal/generate', methods=['POST'])
@jwt_required()
def generate_meal_plan():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.profile:
            return jsonify({'success': False, 'error': 'User profile not found'}), 404
        
        data = request.get_json() or {}
        start_date = datetime.utcnow().date()
        end_date = start_date + timedelta(days=6)
        
        # Deactivate old plans
        WeeklyMealPlan.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
        
        # Generate plan data
        plan_data, daily_calories = PlanGeneratorService.generate_meal_plan(user.profile, start_date)
        
        # Create new plan
        plan = WeeklyMealPlan(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            plan_data=plan_data,
            total_calories_per_day=daily_calories,
            dietary_preferences=data.get('dietary_preferences', []),
            is_active=True
        )
        
        db.session.add(plan)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/meal/current', methods=['GET'])
@jwt_required()
def get_current_meal_plan():
    try:
        user_id = get_jwt_identity()
        
        plan = WeeklyMealPlan.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not plan:
            return jsonify({'success': False, 'error': 'No active meal plan found'}), 404
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/meal/history', methods=['GET'])
@jwt_required()
def get_meal_plan_history():
    try:
        user_id = get_jwt_identity()
        
        plans = WeeklyMealPlan.query.filter_by(user_id=user_id)\
            .order_by(WeeklyMealPlan.created_at.desc())\
            .limit(10)\
            .all()
        
        return jsonify({
            'success': True,
            'data': {'plans': [p.to_dict() for p in plans]}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/meal/<meal_plan_id>/customize', methods=['PUT'])
@jwt_required()
def customize_meal_plan(meal_plan_id):
    try:
        user_id = get_jwt_identity()
        
        plan = WeeklyMealPlan.query.filter_by(meal_plan_id=meal_plan_id, user_id=user_id).first()
        
        if not plan:
            return jsonify({'success': False, 'error': 'Plan not found'}), 404
        
        data = request.get_json()
        
        if 'dietary_preferences' in data:
            plan.dietary_preferences = data['dietary_preferences']
        
        if 'plan_data' in data:
            plan.plan_data = data['plan_data']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {'plan': plan.to_dict()}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
